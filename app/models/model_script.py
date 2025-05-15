import torch
import torch.nn as nn
import torch.optim as optim
from torch.nn.utils.rnn import pad_sequence
import numpy as np

# -------------------------------
# Data Utilities
# -------------------------------

def load_dakshina_data(file_path):
    input_texts, target_texts = [], []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) == 3:
                hindi_word, latin_input, _ = parts
                input_texts.append(latin_input.lower())
                target_texts.append(hindi_word)
    return input_texts, target_texts

def create_vocab(texts, special_tokens=[]):
    vocab = sorted(set("".join(texts)))
    stoi = {ch: i + len(special_tokens) for i, ch in enumerate(vocab)}
    for i, tok in enumerate(special_tokens):
        stoi[tok] = i
    itos = {i: ch for ch, i in stoi.items()}
    return stoi, itos

def encode(text, stoi):
    return [stoi[c] for c in text]

def collate_fn(batch, pad_idx):
    inputs, targets = zip(*batch)
    inputs = [torch.tensor(seq, dtype=torch.long) for seq in inputs]
    targets = [torch.tensor(seq, dtype=torch.long) for seq in targets]
    inputs_padded = pad_sequence(inputs, padding_value=pad_idx, batch_first=True)
    targets_padded = pad_sequence(targets, padding_value=pad_idx, batch_first=True)
    return inputs_padded, targets_padded

# -------------------------------
#  Encoder-Decoder Model v1
# -------------------------------

class Encoder(nn.Module):
    def __init__(self, vocab_size, emb_size, hidden_size):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, emb_size, padding_idx=0)
        self.rnn = nn.GRU(emb_size, hidden_size, batch_first=True)

    def forward(self, x):
        embedded = self.embedding(x)
        outputs, hidden = self.rnn(embedded)
        return outputs, hidden

class Decoder(nn.Module):
    def __init__(self, vocab_size, emb_size, hidden_size):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, emb_size, padding_idx=0)
        self.rnn = nn.GRU(emb_size, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, vocab_size)

    def forward(self, x, hidden):
        embedded = self.embedding(x).unsqueeze(1)  # [B, 1, E]
        output, hidden = self.rnn(embedded, hidden)  # [B, 1, H]
        prediction = self.fc(output.squeeze(1))  # [B, V]
        return prediction, hidden


# -------------------------------
#  Encoder-Decoder Model v2
# -------------------------------

class Encoder2(nn.Module):
    def __init__(self, vocab_size, emb_size, hidden_size):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, emb_size, padding_idx=0)
        self.rnn = nn.GRU(emb_size, hidden_size, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_size * 2, hidden_size)

    def forward(self, x):
        embedded = self.embedding(x)
        outputs, hidden = self.rnn(embedded)
        hidden = torch.tanh(self.fc(torch.cat((hidden[-2,:,:], hidden[-1,:,:]), dim=1))).unsqueeze(0)
        return outputs, hidden

class Attention(nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.hidden_size = hidden_size
        self.attn = nn.Linear(hidden_size * 3, hidden_size)  # fixed
        self.v = nn.Linear(hidden_size, 1, bias=False)

    def forward(self, hidden, encoder_outputs):
        batch_size, seq_len, _ = encoder_outputs.shape

        # hidden: (1, B, H) → (B, 1, H) → (B, S, H)
        hidden = hidden.permute(1, 0, 2).repeat(1, seq_len, 1)

        # encoder_outputs: (B, S, H*2)
        combined = torch.cat((hidden, encoder_outputs), dim=2)  # (B, S, H*3)
        energy = torch.tanh(self.attn(combined))  # (B, S, H)
        attention = self.v(energy).squeeze(2)     # (B, S)
        return torch.softmax(attention, dim=1)    # (B, S)


class Decoder2(nn.Module):
    def __init__(self, vocab_size, emb_size, hidden_size):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, emb_size, padding_idx=0)
        self.rnn = nn.GRU(emb_size + hidden_size * 2, hidden_size, batch_first=True)
        self.fc = nn.Linear(hidden_size, vocab_size)
        self.attention = Attention(hidden_size)

    def forward(self, x, hidden, encoder_outputs):
        embedded = self.embedding(x).unsqueeze(1)
        attn_weights = self.attention(hidden, encoder_outputs).unsqueeze(1)
        context = torch.bmm(attn_weights, encoder_outputs)
        rnn_input = torch.cat((embedded, context), dim=2)
        output, hidden = self.rnn(rnn_input, hidden)
        prediction = self.fc(output.squeeze(1))
        return prediction, hidden



# -------------------------------
# Main
# -------------------------------

def predict(word, encoder, decoder, input_stoi, target_itos, target_stoi, max_len=20 ,model=1):
    encoder.eval()
    decoder.eval()
    with torch.no_grad():
        # Encode input
        input_tensor = torch.tensor([input_stoi.get(c, 0) for c in word], dtype=torch.long).unsqueeze(0)  # [1, seq_len]
        encoder_outputs, hidden = encoder(input_tensor)

        # Start decoding with <sos>
        sos_token = '␂'
        eos_token = '␃'
        input_token = torch.tensor([target_stoi[sos_token]], dtype=torch.long)  # [batch_size]

        output = []
        for _ in range(max_len):
            if model == 1:
                logits, hidden = decoder(input_token, hidden)
            if model == 2:
                logits, hidden = decoder(input_token, hidden , encoder_outputs)
            next_token = logits.argmax(-1).item()
            char = target_itos.get(next_token, '')

            if char == eos_token:
                break

            output.append(char)
            input_token = torch.tensor([next_token], dtype=torch.long)

        return ''.join(output)


def start_engine(model=1):
    checkpoint = None
    encoder = None
    decoder = None
    
    if model == 1:
        checkpoint = torch.load('transliteration_model_v1.pth', map_location='cpu')
    
    if model == 2:
        checkpoint = torch.load('transliteration_model_v2.pth', map_location='cpu')

    # Restore vocab
    input_stoi = checkpoint['input_stoi']
    target_stoi = checkpoint['target_stoi']
    input_itos = checkpoint['input_itos']
    target_itos = checkpoint['target_itos']

    # Match model architecture used during training
    input_vocab_size = len(input_stoi)
    target_vocab_size = len(target_stoi)
    emb_size = 64
    hidden_size = 256

    if model == 1:
        encoder = Encoder(input_vocab_size, emb_size=emb_size, hidden_size=hidden_size)
        decoder = Decoder(target_vocab_size, emb_size=emb_size, hidden_size=hidden_size)
    
    if model == 2:
        encoder = Encoder2(input_vocab_size, emb_size=emb_size, hidden_size=hidden_size)
        decoder = Decoder2(target_vocab_size, emb_size=emb_size, hidden_size=hidden_size)

    # Load trained weights
    encoder.load_state_dict(checkpoint['encoder_state'])
    decoder.load_state_dict(checkpoint['decoder_state'])

    # Evaluation mode
    encoder.eval()
    decoder.eval()
    return encoder, decoder, input_stoi, target_itos, target_stoi, model


def get_word(word,encoder, decoder, input_stoi, target_itos, target_stoi,model):
    word = f"{word}"
    prediction = predict(word, encoder, decoder, input_stoi, target_itos, target_stoi, model=model)
    return f"{prediction}"

