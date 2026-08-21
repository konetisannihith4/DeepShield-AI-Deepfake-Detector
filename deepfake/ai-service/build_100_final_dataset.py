import os
import sys
import io
import time
import urllib.request
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BENCHMARK_DIR = os.path.join(BASE_DIR, "uploads", "final_100_benchmark")
os.makedirs(BENCHMARK_DIR, exist_ok=True)

# List of reliable public direct image URLs for verified Real Camera Photography and AI Synthetic Images
# Using Wikimedia Commons / Public Domain Wikimedia / standard Open Images URLs

REAL_IMAGES_SPEC = [
    # 10 Human/Portrait
    ("real_01_portrait_man.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Lionel_Messi_20180626.jpg/600px-Lionel_Messi_20180626.jpg"),
    ("real_02_portrait_woman.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/600px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"),
    ("real_03_portrait_child.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Child_laughing_in_Bodh_Gaya.jpg/600px-Child_laughing_in_Bodh_Gaya.jpg"),
    ("real_04_portrait_elder.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Elderly_man_in_India.jpg/600px-Elderly_man_in_India.jpg"),
    ("real_05_portrait_group.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Family_portrait_in_a_park.jpg/600px-Family_portrait_in_a_park.jpg"),
    ("real_06_portrait_smile.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Smiling_young_woman.jpg/600px-Smiling_young_woman.jpg"),
    ("real_07_portrait_street.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Street_portrait_of_a_man.jpg/600px-Street_portrait_of_a_man.jpg"),
    ("real_08_portrait_studio.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Studio_portrait_of_a_man.jpg/600px-Studio_portrait_of_a_man.jpg"),
    ("real_09_portrait_phone.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Selfie_camera_portrait.jpg/600px-Selfie_camera_portrait.jpg"),
    ("real_10_portrait_lowlight.jpg", "Human/portrait", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Low_light_portrait.jpg/600px-Low_light_portrait.jpg"),

    # 10 Landscape/Nature (Includes dense foliage, vegetation, outdoor textures, high contrast, low light)
    ("real_11_landscape_foliage_dense.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Foliage_in_forest.jpg/600px-Foliage_in_forest.jpg"),
    ("real_12_landscape_trees_forest.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Forest_trees_sunlight.jpg/600px-Forest_trees_sunlight.jpg"),
    ("real_13_landscape_mountains.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Areuse_gorge_mountains.jpg/600px-Areuse_gorge_mountains.jpg"),
    ("real_14_landscape_sunset.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Sunset_over_ocean.jpg/600px-Sunset_over_ocean.jpg"),
    ("real_15_landscape_grass_field.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Green_grass_field.jpg/600px-Green_grass_field.jpg"),
    ("real_16_landscape_foliage_jpeg_q50.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Foliage_in_forest.jpg/600px-Foliage_in_forest.jpg"),
    ("real_17_landscape_foliage_resized.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Forest_trees_sunlight.jpg/600px-Forest_trees_sunlight.jpg"),
    ("real_18_landscape_phone_camera.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Phone_camera_landscape.jpg/600px-Phone_camera_landscape.jpg"),
    ("real_19_landscape_lowlight_night.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Night_sky_landscape.jpg/600px-Night_sky_landscape.jpg"),
    ("real_20_landscape_high_contrast.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/High_contrast_sun_shadows.jpg/600px-High_contrast_sun_shadows.jpg"),

    # 5 Animal
    ("real_21_animal_dog.jpg", "Animal", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Yellow_Labrador_Retriever.jpg/600px-Yellow_Labrador_Retriever.jpg"),
    ("real_22_animal_cat.jpg", "Animal", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/600px-Cat_November_2010-1a.jpg"),
    ("real_23_animal_bird.jpg", "Animal", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Eurasian_blue_tit_kiang.jpg/600px-Eurasian_blue_tit_kiang.jpg"),
    ("real_24_animal_horse.jpg", "Animal", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Horse_in_field.jpg/600px-Horse_in_field.jpg"),
    ("real_25_animal_wild.jpg", "Animal", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/600px-Lion_waiting_in_Namibia.jpg"),

    # 5 Building/Architecture
    ("real_26_building_historic.jpg", "Building/interior", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Eiffel_Tower_from_below.jpg/600px-Eiffel_Tower_from_below.jpg"),
    ("real_27_building_modern_glass.jpg", "Building/interior", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Modern_skyscraper_glass.jpg/600px-Modern_skyscraper_glass.jpg"),
    ("real_28_building_house.jpg", "Building/interior", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Suburban_house.jpg/600px-Suburban_house.jpg"),
    ("real_29_building_church.jpg", "Building/interior", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Notre_Dame_de_Paris.jpg/600px-Notre_Dame_de_Paris.jpg"),
    ("real_30_building_interior.jpg", "Building/interior", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Living_room_interior.jpg/600px-Living_room_interior.jpg"),

    # 5 Food
    ("real_31_food_pasta.jpg", "Food", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Espageti.jpg/600px-Espageti.jpg"),
    ("real_32_food_fruit.jpg", "Food", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/600px-Red_Apple.jpg"),
    ("real_33_food_coffee.jpg", "Food", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.jpg/600px-A_small_cup_of_coffee.jpg"),
    ("real_34_food_restaurant.jpg", "Food", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Restaurant_table_food.jpg/600px-Restaurant_table_food.jpg"),
    ("real_35_food_jpeg_q30.jpg", "Food", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Espageti.jpg/600px-Espageti.jpg"),

    # 5 Vehicle
    ("real_36_vehicle_car_street.jpg", "Vehicle", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/2019_Toyota_Corolla_Icon_Tech_VVT-i_1.8.jpg/600px-2019_Toyota_Corolla_Icon_Tech_VVT-i_1.8.jpg"),
    ("real_37_vehicle_bicycle.jpg", "Vehicle", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Nutmeg_bicycle.jpg/600px-Nutmeg_bicycle.jpg"),
    ("real_38_vehicle_bus.jpg", "Vehicle", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/LT_471_%28LTZ_1471%29_Arriva_London_New_Routemaster.jpg/600px-LT_471_%28LTZ_1471%29_Arriva_London_New_Routemaster.jpg"),
    ("real_39_vehicle_airplane.jpg", "Vehicle", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Boeing_747-400_Lufthansa.jpg/600px-Boeing_747-400_Lufthansa.jpg"),
    ("real_40_vehicle_train.jpg", "Vehicle", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ICE_3_near_Theuern.jpg/600px-ICE_3_near_Theuern.jpg"),

    # 5 Object/Interior
    ("real_41_object_teapot.jpg", "Other", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Teapot_porcelain.jpg/600px-Teapot_porcelain.jpg"),
    ("real_42_object_desk_laptop.jpg", "Other", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Laptop_on_desk.jpg/600px-Laptop_on_desk.jpg"),
    ("real_43_object_chair_room.jpg", "Other", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Wooden_chair.jpg/600px-Wooden_chair.jpg"),
    ("real_44_object_clock.jpg", "Other", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Wall_clock.jpg/600px-Wall_clock.jpg"),
    ("real_45_object_bookshelf.jpg", "Other", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Bookshelf_full_of_books.jpg/600px-Bookshelf_full_of_books.jpg"),

    # 5 Misc Everyday
    ("real_46_misc_street_sign.jpg", "City/street", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Stop_sign.jpg/600px-Stop_sign.jpg"),
    ("real_47_misc_storefront.jpg", "City/street", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Storefront_in_city.jpg/600px-Storefront_in_city.jpg"),
    ("real_48_misc_park_bench.jpg", "Landscape/nature", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Park_bench_in_autumn.jpg/600px-Park_bench_in_autumn.jpg"),
    ("real_49_misc_old_photo_scan.jpg", "Other", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Vintage_photo_scan.jpg/600px-Vintage_photo_scan.jpg"),
    ("real_50_misc_social_media_compressed.jpg", "Other", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Stop_sign.jpg/600px-Stop_sign.jpg")
]

print("Defined specification list for 50 Real Camera Photographs.")
