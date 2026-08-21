import os
import csv
import numpy as np
from PIL import Image

from image_ai_detector import ImageAIDetectorEngine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BENCHMARK_DIR = os.path.join(BASE_DIR, "uploads", "final_100_benchmark")
CSV_PATH = os.path.join(BASE_DIR, "xrayon_final_100_benchmark.csv")
REPORT_PATH = os.path.join(BASE_DIR, "xrayon_final_100_benchmark_report.md")

# Ground truth & category mapping for all 100 images
CATEGORY_MAP = {
    # 50 AI Images
    "ai_01_portrait_man.jpg": ("AI", "Human/portrait"),
    "ai_02_portrait_woman.jpg": ("AI", "Human/portrait"),
    "ai_03_portrait_boy.jpg": ("AI", "Human/portrait"),
    "ai_04_portrait_girl.jpg": ("AI", "Human/portrait"),
    "ai_05_portrait_elderly.jpg": ("AI", "Human/portrait"),
    "ai_06_portrait_studio.jpg": ("AI", "Human/portrait"),
    "ai_07_portrait_fashion.jpg": ("AI", "Human/portrait"),
    "ai_08_portrait_cyberpunk.jpg": ("AI", "Human/portrait"),
    "ai_09_portrait_realism.jpg": ("AI", "Human/portrait"),
    "ai_10_portrait_smile.jpg": ("AI", "Human/portrait"),

    "ai_11_animal_tiger.jpg": ("AI", "Animal"),
    "ai_12_animal_cat.jpg": ("AI", "Animal"),
    "ai_13_animal_dog.jpg": ("AI", "Animal"),
    "ai_14_animal_dragon.jpg": ("AI", "Animal"),
    "ai_15_animal_bird.jpg": ("AI", "Animal"),

    "ai_16_landscape_mountains.jpg": ("AI", "Landscape/nature"),
    "ai_17_landscape_sunset.jpg": ("AI", "Landscape/nature"),
    "ai_18_landscape_forest.jpg": ("AI", "Landscape/nature"),
    "ai_19_landscape_ocean.jpg": ("AI", "Landscape/nature"),
    "ai_20_landscape_waterfall.jpg": ("AI", "Landscape/nature"),

    "ai_21_city_futuristic.jpg": ("AI", "City/street"),
    "ai_22_city_tokyo_night.jpg": ("AI", "City/street"),
    "ai_23_city_street_rain.jpg": ("AI", "City/street"),
    "ai_24_city_cyberpunk_alley.jpg": ("AI", "City/street"),
    "ai_25_city_skyline.jpg": ("AI", "City/street"),

    "ai_26_building_interior_modern.jpg": ("AI", "Building/interior"),
    "ai_27_building_castle.jpg": ("AI", "Building/interior"),
    "ai_28_building_luxury_room.jpg": ("AI", "Building/interior"),
    "ai_29_building_palace.jpg": ("AI", "Building/interior"),
    "ai_30_building_futuristic_hall.jpg": ("AI", "Building/interior"),

    "ai_31_food_burger.jpg": ("AI", "Food"),
    "ai_32_food_pizza.jpg": ("AI", "Food"),
    "ai_33_food_cake.jpg": ("AI", "Food"),
    "ai_34_food_sushi.jpg": ("AI", "Food"),
    "ai_35_food_gourmet.jpg": ("AI", "Food"),

    "ai_36_vehicle_sports_car.jpg": ("AI", "Vehicle"),
    "ai_37_vehicle_spaceship.jpg": ("AI", "Vehicle"),
    "ai_38_vehicle_concept_bike.jpg": ("AI", "Vehicle"),
    "ai_39_vehicle_flying_car.jpg": ("AI", "Vehicle"),
    "ai_40_vehicle_luxury_yacht.jpg": ("AI", "Vehicle"),

    "ai_41_artwork_oil_painting.jpg": ("AI", "Artwork/illustration"),
    "ai_42_artwork_anime_girl.jpg": ("AI", "Artwork/illustration"),
    "ai_43_artwork_abstract.jpg": ("AI", "Artwork/illustration"),
    "ai_44_artwork_digital_sketch.jpg": ("AI", "Artwork/illustration"),
    "ai_45_artwork_surrealism.jpg": ("AI", "Artwork/illustration"),

    "ai_46_fantasy_robot_warrior.jpg": ("AI", "Fantasy/technology"),
    "ai_47_fantasy_alien_world.jpg": ("AI", "Fantasy/technology"),
    "ai_48_fantasy_magic_portal.jpg": ("AI", "Fantasy/technology"),
    "ai_49_fantasy_cyber_android.jpg": ("AI", "Fantasy/technology"),
    "ai_50_fantasy_space_station.jpg": ("AI", "Fantasy/technology"),

    # 50 Real Photos
    "real_01_portrait_man.jpg": ("NATURAL", "Human/portrait"),
    "real_02_portrait_woman.jpg": ("NATURAL", "Human/portrait"),
    "real_03_portrait_child.jpg": ("NATURAL", "Human/portrait"),
    "real_04_portrait_elder.jpg": ("NATURAL", "Human/portrait"),
    "real_05_portrait_group.jpg": ("NATURAL", "Human/portrait"),
    "real_06_portrait_smile.jpg": ("NATURAL", "Human/portrait"),
    "real_07_portrait_street.jpg": ("NATURAL", "Human/portrait"),
    "real_08_portrait_studio.jpg": ("NATURAL", "Human/portrait"),
    "real_09_portrait_phone.jpg": ("NATURAL", "Human/portrait"),
    "real_10_portrait_lowlight.jpg": ("NATURAL", "Human/portrait"),

    "real_11_landscape_foliage_dense.jpg": ("NATURAL", "Landscape/nature"),
    "real_12_landscape_trees_forest.jpg": ("NATURAL", "Landscape/nature"),
    "real_13_landscape_mountains.jpg": ("NATURAL", "Landscape/nature"),
    "real_14_landscape_sunset.jpg": ("NATURAL", "Landscape/nature"),
    "real_15_landscape_grass_field.jpg": ("NATURAL", "Landscape/nature"),
    "real_16_landscape_foliage_jpeg_q50.jpg": ("NATURAL", "Landscape/nature"),
    "real_17_landscape_foliage_resized.jpg": ("NATURAL", "Landscape/nature"),
    "real_18_landscape_phone_camera.jpg": ("NATURAL", "Landscape/nature"),
    "real_19_landscape_lowlight_night.jpg": ("NATURAL", "Landscape/nature"),
    "real_20_landscape_high_contrast.jpg": ("NATURAL", "Landscape/nature"),

    "real_21_animal_dog.jpg": ("NATURAL", "Animal"),
    "real_22_animal_cat.jpg": ("NATURAL", "Animal"),
    "real_23_animal_bird.jpg": ("NATURAL", "Animal"),
    "real_24_animal_horse.jpg": ("NATURAL", "Animal"),
    "real_25_animal_wild.jpg": ("NATURAL", "Animal"),

    "real_26_building_historic.jpg": ("NATURAL", "Building/interior"),
    "real_27_building_modern_glass.jpg": ("NATURAL", "Building/interior"),
    "real_28_building_house.jpg": ("NATURAL", "Building/interior"),
    "real_29_building_church.jpg": ("NATURAL", "Building/interior"),
    "real_30_building_interior.jpg": ("NATURAL", "Building/interior"),

    "real_31_food_pasta.jpg": ("NATURAL", "Food"),
    "real_32_food_fruit.jpg": ("NATURAL", "Food"),
    "real_33_food_coffee.jpg": ("NATURAL", "Food"),
    "real_34_food_restaurant.jpg": ("NATURAL", "Food"),
    "real_35_food_jpeg_q30.jpg": ("NATURAL", "Food"),

    "real_36_vehicle_car_street.jpg": ("NATURAL", "Vehicle"),
    "real_37_vehicle_bicycle.jpg": ("NATURAL", "Vehicle"),
    "real_38_vehicle_bus.jpg": ("NATURAL", "Vehicle"),
    "real_39_vehicle_airplane.jpg": ("NATURAL", "Vehicle"),
    "real_40_vehicle_train.jpg": ("NATURAL", "Vehicle"),

    "real_41_object_teapot.jpg": ("NATURAL", "Other"),
    "real_42_object_desk_laptop.jpg": ("NATURAL", "Other"),
    "real_43_object_chair_room.jpg": ("NATURAL", "Other"),
    "real_44_object_clock.jpg": ("NATURAL", "Other"),
    "real_45_object_bookshelf.jpg": ("NATURAL", "Other"),

    "real_46_misc_street_sign.jpg": ("NATURAL", "City/street"),
    "real_47_misc_storefront.jpg": ("NATURAL", "City/street"),
    "real_48_misc_park_bench.jpg": ("NATURAL", "Landscape/nature"),
    "real_49_misc_old_photo_scan.jpg": ("NATURAL", "Other"),
    "real_50_misc_social_media_compressed.jpg": ("NATURAL", "Other")
}

def execute_benchmark():
    print("=" * 110)
    print("EXECUTING FRESH 100-IMAGE BENCHMARK ON EXISTING xRayon CONVNEXTV2 DETECTOR")
    print("=" * 110)

    engine = ImageAIDetectorEngine()
    results = []

    files = sorted(os.listdir(BENCHMARK_DIR))
    print(f"Total Specimen Files Found: {len(files)}")

    for fname in files:
        if not fname.endswith((".jpg", ".png", ".jpeg")):
            continue

        fpath = os.path.join(BENCHMARK_DIR, fname)
        with open(fpath, "rb") as f:
            img_bytes = f.read()

        res = engine.predict_image_bytes(img_bytes, filename=fname)

        gt, category = CATEGORY_MAP.get(fname, ("UNKNOWN", "Other"))
        raw_ai_prob = float(res["deepfakeProbability"])
        raw_real_prob = float(max(0.0, 1.0 - raw_ai_prob))
        prediction = res["prediction"]
        conf = float(res["confidence"])

        # Determine result_type under Strict 3-Way Logic (>=0.95 AI, <=0.50 Natural, else Uncertain)
        if prediction == "Likely AI Generated":
            if gt == "AI": result_type = "TP"
            else: result_type = "FP"
        elif prediction == "Likely Natural":
            if gt == "NATURAL": result_type = "TN"
            else: result_type = "FN"
        else: # "Uncertain"
            result_type = "UNCERTAIN"

        results.append({
            "filename": fname,
            "ground_truth": gt,
            "category": category,
            "AI_probability": f"{raw_ai_prob*100:.4f}%",
            "real_probability": f"{raw_real_prob*100:.4f}%",
            "raw_ai_prob": raw_ai_prob,
            "prediction": prediction,
            "confidence": f"{conf*100:.4f}%",
            "result_type": result_type
        })

    # Save to xrayon_final_100_benchmark.csv
    csv_fields = ["filename", "ground_truth", "category", "AI_probability", "real_probability", "prediction", "confidence", "result_type"]
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields)
        writer.writeheader()
        for r in results:
            writer.writerow({k: r[k] for k in csv_fields})

    print(f"\n[OK] CSV benchmark written to: {CSV_PATH}")

    # Return results for report generation
    return results

if __name__ == "__main__":
    execute_benchmark()
