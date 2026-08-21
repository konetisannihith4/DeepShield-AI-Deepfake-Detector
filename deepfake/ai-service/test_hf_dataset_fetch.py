from datasets import load_dataset

def test_fetch():
    print("Testing HuggingFace streaming dataset access...")
    try:
        ds = load_dataset("dima806/deepfake_vs_real_image_detection", split="train", streaming=True)
        for i, item in enumerate(ds):
            print(f"Sample {i}: label={item.get('label')}, img_size={item['image'].size}")
            if i >= 3:
                break
        print("[OK] HF streaming working successfully!")
    except Exception as e:
        print(f"[Error] {e}")

if __name__ == "__main__":
    test_fetch()
