import os

REAL_DIR = r"C:\Users\konet\Downloads\dataset ai vs real\real_dataset"
AI_DIR = r"C:\Users\konet\Downloads\dataset ai vs real\Ai_generated_dataset"

def inspect():
    print("=" * 80)
    print("INSPECTING KAGGLE REAL-VS-AI DATASET STRUCTURE")
    print("=" * 80)

    print(f"\nReal Dataset Directory: {REAL_DIR}")
    if os.path.exists(REAL_DIR):
        real_files = []
        real_subdirs = []
        for root, dirs, files in os.walk(REAL_DIR):
            for d in dirs:
                real_subdirs.append(os.path.join(root, d))
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff')):
                    real_files.append(os.path.join(root, f))
        print(f"  - Found {len(real_subdirs)} subdirectories")
        print(f"  - Found {len(real_files)} real image files")
        # Print subdirectories structure
        sub_list = set(os.path.relpath(os.path.dirname(p), REAL_DIR) for p in real_files)
        print(f"  - Categories found: {sorted(list(sub_list))[:15]}")
    else:
        print("  [ERROR] Real dataset path does not exist!")

    print(f"\nAI Generated Dataset Directory: {AI_DIR}")
    if os.path.exists(AI_DIR):
        ai_files = []
        ai_subdirs = []
        for root, dirs, files in os.walk(AI_DIR):
            for d in dirs:
                ai_subdirs.append(os.path.join(root, d))
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff')):
                    ai_files.append(os.path.join(root, f))
        print(f"  - Found {len(ai_subdirs)} subdirectories")
        print(f"  - Found {len(ai_files)} AI image files")
        sub_list_ai = set(os.path.relpath(os.path.dirname(p), AI_DIR) for p in ai_files)
        print(f"  - Categories found: {sorted(list(sub_list_ai))[:15]}")
    else:
        print("  [ERROR] AI dataset path does not exist!")

    print("=" * 80)

if __name__ == "__main__":
    inspect()
