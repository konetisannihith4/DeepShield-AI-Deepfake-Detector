"""
FaceForensics++ (FF++) Xception Network Architecture and Pretrained Model Loader.
Includes model loading, strict checkpoint verification, and inference batch prediction.
"""

import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any, Tuple, List
from .config import VideoConfig


class SeparableConv2d(nn.Module):
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int = 1,
        stride: int = 1,
        padding: int = 0,
        dilation: int = 1,
        bias: bool = False,
    ):
        super(SeparableConv2d, self).__init__()
        self.conv1 = nn.Conv2d(
            in_channels,
            in_channels,
            kernel_size,
            stride,
            padding,
            dilation,
            groups=in_channels,
            bias=bias,
        )
        self.pointwise = nn.Conv2d(in_channels, out_channels, 1, 1, 0, 1, 1, bias=bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.conv1(x)
        x = self.pointwise(x)
        return x


class Block(nn.Module):
    def __init__(
        self,
        in_filters: int,
        out_filters: int,
        reps: int,
        strides: int = 1,
        start_with_relu: bool = True,
        grow_first: bool = True,
    ):
        super(Block, self).__init__()
        if out_filters != in_filters or strides != 1:
            self.skip = nn.Conv2d(in_filters, out_filters, 1, stride=strides, bias=False)
            self.skipbn = nn.BatchNorm2d(out_filters)
        else:
            self.skip = None

        rep = []
        filters = in_filters
        if grow_first:
            rep.append(nn.ReLU(inplace=True))
            rep.append(SeparableConv2d(in_filters, out_filters, 3, stride=1, padding=1, bias=False))
            rep.append(nn.BatchNorm2d(out_filters))
            filters = out_filters

        for _ in range(reps - 1):
            rep.append(nn.ReLU(inplace=True))
            rep.append(SeparableConv2d(filters, filters, 3, stride=1, padding=1, bias=False))
            rep.append(nn.BatchNorm2d(filters))

        if not grow_first:
            rep.append(nn.ReLU(inplace=True))
            rep.append(SeparableConv2d(in_filters, out_filters, 3, stride=1, padding=1, bias=False))
            rep.append(nn.BatchNorm2d(out_filters))

        if not start_with_relu:
            rep = rep[1:]
        else:
            rep[0] = nn.ReLU(inplace=False)

        if strides != 1:
            rep.append(nn.MaxPool2d(3, strides, 1))
        self.rep = nn.Sequential(*rep)

    def forward(self, inp: torch.Tensor) -> torch.Tensor:
        x = self.rep(inp)
        if self.skip is not None:
            skip = self.skip(inp)
            skip = self.skipbn(skip)
        else:
            skip = inp
        x += skip
        return x


class Xception(nn.Module):
    def __init__(self, num_classes: int = 2):
        super(Xception, self).__init__()
        self.num_classes = num_classes
        self.conv1 = nn.Conv2d(3, 32, 3, 2, 0, bias=False)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, 3, 1, 0, bias=False)
        self.bn2 = nn.BatchNorm2d(64)

        self.block1 = Block(64, 128, 2, 2, start_with_relu=False, grow_first=True)
        self.block2 = Block(128, 256, 2, 2, start_with_relu=True, grow_first=True)
        self.block3 = Block(256, 728, 2, 2, start_with_relu=True, grow_first=True)

        self.block4 = Block(728, 728, 3, 1, start_with_relu=True, grow_first=True)
        self.block5 = Block(728, 728, 3, 1, start_with_relu=True, grow_first=True)
        self.block6 = Block(728, 728, 3, 1, start_with_relu=True, grow_first=True)
        self.block7 = Block(728, 728, 3, 1, start_with_relu=True, grow_first=True)
        self.block8 = Block(728, 728, 3, 1, start_with_relu=True, grow_first=True)
        self.block9 = Block(728, 728, 3, 1, start_with_relu=True, grow_first=True)
        self.block10 = Block(728, 728, 3, 1, start_with_relu=True, grow_first=True)
        self.block11 = Block(728, 728, 3, 1, start_with_relu=True, grow_first=True)

        self.block12 = Block(728, 1024, 2, 2, start_with_relu=True, grow_first=False)

        self.conv3 = SeparableConv2d(1024, 1536, 3, 1, 1)
        self.bn3 = nn.BatchNorm2d(1536)

        self.conv4 = SeparableConv2d(1536, 2048, 3, 1, 1)
        self.bn4 = nn.BatchNorm2d(2048)

        self.last_linear = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(2048, num_classes)
        )

    def features(self, input: torch.Tensor) -> torch.Tensor:
        x = self.conv1(input)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.conv2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.block1(x)
        x = self.block2(x)
        x = self.block3(x)
        x = self.block4(x)
        x = self.block5(x)
        x = self.block6(x)
        x = self.block7(x)
        x = self.block8(x)
        x = self.block9(x)
        x = self.block10(x)
        x = self.block11(x)
        x = self.block12(x)
        x = self.conv3(x)
        x = self.bn3(x)
        x = F.relu(x)
        x = self.conv4(x)
        x = self.bn4(x)
        x = F.relu(x)
        return x

    def forward(self, input: torch.Tensor) -> torch.Tensor:
        x = self.features(input)
        x = F.adaptive_avg_pool2d(x, (1, 1))
        x = x.view(x.size(0), -1)
        x = self.last_linear(x)
        return x


class TransferModel(nn.Module):
    """
    Wrapper around Xception network matching FF++ architecture saved in ffpp_c23.pth.
    """

    def __init__(self, num_classes: int = 2):
        super(TransferModel, self).__init__()
        self.model = Xception(num_classes=num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x)


class XceptionDetector:
    """
    Xception deepfake model loader, verifier, and inference engine.
    """

    def __init__(self, config: VideoConfig = VideoConfig()):
        self.config = config
        self.weights_path = config.MODEL_WEIGHTS_PATH
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None

    def load_model(self) -> TransferModel:
        """
        Loads the pretrained model weights from ffpp_c23.pth.
        Performs strict key verification and shape testing.
        """
        if not os.path.exists(self.weights_path):
            raise FileNotFoundError(
                f"CRITICAL ERROR: Pretrained model weights file not found at '{self.weights_path}'."
            )

        print(f"Loading pretrained FaceForensics++ weights from: {self.weights_path}")
        print(f"Target compute device: {self.device}")

        net = TransferModel(num_classes=2)

        try:
            state_dict = torch.load(self.weights_path, map_location=self.device)
            if isinstance(state_dict, dict) and "state_dict" in state_dict:
                state_dict = state_dict["state_dict"]
        except Exception as e:
            raise RuntimeError(f"CRITICAL ERROR: Failed to read model checkpoint '{self.weights_path}': {str(e)}")

        try:
            load_result = net.load_state_dict(state_dict, strict=True)
            missing_keys = load_result.missing_keys
            unexpected_keys = load_result.unexpected_keys
        except Exception as e:
            raise RuntimeError(
                f"CRITICAL ERROR: Weight loading state_dict mismatch with ffpp_c23.pth: {str(e)}"
            )

        if missing_keys or unexpected_keys:
            raise RuntimeError(
                f"CRITICAL ERROR: Key mismatch detected during model loading. "
                f"Missing keys: {missing_keys}, Unexpected keys: {unexpected_keys}"
            )

        net.eval()
        net.to(self.device)

        try:
            with torch.no_grad():
                dummy_input = torch.zeros(1, 3, 299, 299, device=self.device)
                output = net(dummy_input)
                if output.shape != (1, 2):
                    raise ValueError(f"Expected output shape (1, 2), got {output.shape}")
        except Exception as e:
            raise RuntimeError(f"CRITICAL ERROR: Model forward-pass tensor shape verification failed: {str(e)}")

        self.model = net
        print("[SUCCESS] Model successfully loaded, strictly verified, and set to eval mode.")
        return self.model

    def predict_batch_with_details(self, input_tensor: torch.Tensor) -> List[Dict[str, Any]]:
        """
        Executes XceptionNet forward pass and returns detailed per-frame prediction dictionaries:
        - raw_logits: [logit_class0, logit_class1]
        - probs: [prob_class0, prob_class1]
        - pred_class: 0 (Real/Natural) or 1 (Fake/AI Generated)
        - fake_prob: prob_class1
        - real_prob: prob_class0
        - confidence: max(prob_class0, prob_class1)
        """
        if self.model is None:
            self.load_model()

        if input_tensor is None or input_tensor.shape[0] == 0:
            return []

        input_tensor = input_tensor.to(self.device)

        results = []
        with torch.no_grad():
            logits_tensor = self.model(input_tensor)  # Shape (N, 2)
            probs_tensor = torch.softmax(logits_tensor, dim=1)  # Softmax probabilities

            logits_np = logits_tensor.cpu().numpy()
            probs_np = probs_tensor.cpu().numpy()

            for i in range(logits_np.shape[0]):
                logit0, logit1 = float(logits_np[i, 0]), float(logits_np[i, 1])
                prob0, prob1 = float(probs_np[i, 0]), float(probs_np[i, 1])
                
                pred_class = 1 if prob1 >= 0.50 else 0
                conf = max(prob0, prob1)

                results.append({
                    "raw_logits": [logit0, logit1],
                    "probs": [prob0, prob1],
                    "real_prob": prob0,
                    "fake_prob": prob1,
                    "pred_class": pred_class,
                    "confidence": conf
                })

        return results

    def predict_batch(self, input_tensor: torch.Tensor) -> List[float]:
        """Returns list of fake probabilities for batch."""
        details = self.predict_batch_with_details(input_tensor)
        return [d["fake_prob"] for d in details]
