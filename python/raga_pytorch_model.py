"""
Raga Finder AI: PyTorch Neural Network for Pitch Class Profile (PCP) Swara Classification

Architecture:
  Input (12-dim Swara Histogram)
  -> Linear(12, 128) -> BatchNorm1d -> GELU -> Dropout(0.2)
  -> Linear(128, 256) -> GELU -> Dropout(0.2)
  -> Linear(256, 128) -> GELU
  -> Linear(128, num_classes) -> Softmax
"""

import json
import torch
import torch.nn as nn
import torch.optim as optim

class RagaPCPNet(nn.Module):
    def __init__(self, input_dim=12, hidden_dim=128, num_classes=72):
        super(RagaPCPNet, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.gelu = nn.GELU()
        self.dropout = nn.Dropout(0.2)
        self.fc2 = nn.Linear(hidden_dim, 256)
        self.fc3 = nn.Linear(256, hidden_dim)
        self.classifier = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        x = self.dropout(self.gelu(self.bn1(self.fc1(x))))
        x = self.dropout(self.gelu(self.fc2(x)))
        x = self.gelu(self.fc3(x))
        logits = self.classifier(x)
        return logits

def export_weights_to_json(model, output_path="pytorch_weights.json"):
    """
    Exports PyTorch model weights to JSON for high-performance
    browser & serverless TypeScript runtime execution.
    """
    state_dict = model.state_dict()
    exportable = {}
    for k, v in state_dict.items():
        exportable[k] = v.cpu().numpy().tolist()
    
    with open(output_path, "w") as f:
        json.dump(exportable, f)
    print(f"Exported PyTorch weights to {output_path}")

if __name__ == "__main__":
    model = RagaPCPNet(input_dim=12, hidden_dim=128, num_classes=72)
    model.eval()
    dummy_input = torch.randn(1, 12)
    output = model(dummy_input)
    print("PyTorch model forward pass successful. Output shape:", output.shape)
    export_weights_to_json(model, "python/pytorch_weights.json")
