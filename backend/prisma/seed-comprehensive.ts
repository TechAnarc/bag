import { PrismaClient, ProductStatus } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

const imageManifest = {
	anklets: [
		"/assets/images/anklets/1023642_Close_up_of_sandy_feet_and_flip_flops_on_a_beach_i_3888x2592.jpeg",
		"/assets/images/anklets/12564237_Close_up_of_feminine_feet_adorned_with_anklets_5423x3615.jpeg",
		"/assets/images/anklets/12564239_A_woman_lounges_on_a_sofa_6000x4000.jpeg",
		"/assets/images/anklets/12564312_Contemplative_woman_in_a_blue_dress_sitting_on_a_w_5898x3932.jpeg",
		"/assets/images/anklets/13041239_Stylish_close_up_of_legs_wearing_black_high_heels__3847x2565.jpeg",
		"/assets/images/anklets/13156143_Detailed_henna_on_feet_with_traditional_anklets_on_8000x5333.jpeg",
		"/assets/images/anklets/15127548_Relaxing_scene_of_elegant_shoes_3880x3668.jpeg",
		"/assets/images/anklets/20192867_Close_up_of_stylish_beaded_anklets_adorning_bare_f_5552x4160.jpeg",
		"/assets/images/anklets/2248589_High_resolution_image_of_crumpled_gold_fabric_4592x3064.jpeg",
		"/assets/images/anklets/248077_Close_up_of_gold_wedding_rings_and_a_delicate_tiar_5760x3840.jpeg",
		"/assets/images/anklets/25578608_Close_up_of_a_baby_s_feet_adorned_with_delicate_go_5304x3536.jpeg",
		"/assets/images/anklets/25578627_Adorable_close_up_of_a_newborn_s_feet_wearing_ankl_5064x3376.jpeg",
		"/assets/images/anklets/31600965_Close_up_of_two_people_in_traditional_attire_6000x4000.jpeg",
		"/assets/images/anklets/33287642_Focused_shot_of_female_feet_with_traditional_ankle_5184x3456.jpeg",
		"/assets/images/anklets/33287736_Close_up_of_feet_in_colorful_attire_and_anklets_5184x3456.jpeg",
		"/assets/images/anklets/342945_Gold_bars_stacked_on_sheet_music_2000x1333.jpeg",
		"/assets/images/anklets/342946_High_angle_shot_of_fine_gold_bars_with_a_luxury_wa_2000x1333.jpeg",
		"/assets/images/anklets/346549_Focused_image_of_100g_Intergold_bars_showcasing_fi_4732x3155.png",
		"/assets/images/anklets/34939270_A_close_up_of_a_bride_performing_a_traditional_Ind_3936x2624.jpeg",
		"/assets/images/anklets/35722332_pexels_image_6249x4166.jpeg",
		"/assets/images/anklets/3641059_Close_up_of_luxurious_rose_gold_jewelry_on_a_sheer_6000x4000.jpeg",
		"/assets/images/anklets/366551_A_detailed_shot_of_gold_bars_labeled__Global_Inter_5070x3380.jpeg",
		"/assets/images/anklets/4015742_Close_up_of_feet_wading_through_gentle_waves_along_5472x3648.jpeg",
		"/assets/images/anklets/4462656_Feet_in_flip_flops_on_a_wooden_deck_with_green_lea_2982x1677.jpeg",
		"/assets/images/anklets/4672716_Artistic_shot_of_diverse_6240x4160.jpeg",
		"/assets/images/anklets/4992841_Artistic_shot_of_female_legs_adorned_with_anklets__5472x3648.jpeg",
		"/assets/images/anklets/4996988_Close_up_of_feet_on_sandy_beach_wearing_anklet__Re_6720x4480.jpeg",
		"/assets/images/anklets/5232907_A_young_adult_skateboards_barefoot_across_a_sunlit_9000x6000.jpeg",
		"/assets/images/anklets/5676230_A_foot_with_an_anklet_submerged_in_clear_water_3469x2610.jpeg",
		"/assets/images/anklets/6676687_A_detailed_close_up_of_a_traditional_anklet_with_b_6000x4000.jpeg",
		"/assets/images/anklets/69198_Close_up_of_feet_in_sand_wearing_an_anklet_5616x3744.jpeg",
		"/assets/images/anklets/7067960_From_above_crop_unrecognizable_pedicured_female_le_4016x2670.jpeg",
		"/assets/images/anklets/7067963_A_close_up_of_delicate_silver_jewelry_on_a_woman_s_3800x2719.jpeg",
		"/assets/images/anklets/7067966_Crop_anonymous_female_legs_with_stylish_pedicure_w_3600x2409.jpeg",
		"/assets/images/anklets/7067993_Close_up_of_hands_and_feet_adorned_with_elegant_go_3200x2128.jpeg",
		"/assets/images/anklets/7067994_From_above_crop_unrecognizable_female_legs_and_han_3500x2327.jpeg",
		"/assets/images/anklets/7067996_Crop_anonymous_female_legs_with_stylish_pedicure_w_3500x2327.jpeg",
		"/assets/images/anklets/7067999_Close_up_of_feminine_feet_and_hands_wearing_elegan_3300x2213.jpeg",
		"/assets/images/anklets/7068000_Crop_anonymous_pedicured_female_legs_in_precious_g_3100x2212.jpeg",
		"/assets/images/anklets/8281154_Close_up_of_a_couple_dancing_tango_5000x3333.jpeg",
		"/assets/images/anklets/8363952_Close_up_of_a_woman_s_feet_resting_on_driftwood_at_6720x4480.jpeg",
		"/assets/images/anklets/8751523_A_woman_in_traditional_clothing_with_anklets_6217x4145.jpeg",
		"/assets/images/anklets/8751544_Close_up_of_feet_in_ornate_traditional_Indian_dres_6460x4307.jpeg",
		"/assets/images/anklets/8759864_Close_up_of_bare_feet_and_anklet_on_rocky_shore_6354x4236.jpeg",
		"/assets/images/anklets/8886928_A_display_of_colorful_beaded_anklets_in_a_jewelry__4867x3245.jpeg",
		"/assets/images/anklets/9024872_Artistic_close_up_of_a_woman_s_feet_with_an_anklet_6000x4000.jpeg",
		"/assets/images/anklets/9045267_Close_up_of_a_woman_walking_barefoot_on_grassy_ter_6000x4000.jpeg",
		"/assets/images/anklets/9107357_Close_up_of_bare_feet_on_brown_soil_4032x3024.jpeg",
		"/assets/images/anklets/9317123_Close_up_of_a_foot_adorned_with_gold_anklet_during_6072x4048.jpeg",
	],
	bangles: [
		"/assets/images/bangles/10911225_Intricate_gold_jewelry_adorns_hands_in_a_tradition_4240x2384.jpeg",
		"/assets/images/bangles/11495747_Henna_adorned_hands_showcasing_traditional_Indian__6000x4000.jpeg",
		"/assets/images/bangles/11639004_Flat_lay_of_coffee_on_magazine_with_bangles_5184x3456.jpeg",
		"/assets/images/bangles/12168879_Minimalist_gold_bracelet_displayed_on_a_pastel_geo_3230x3161.jpeg",
		"/assets/images/bangles/12194299_Close_up_of_a_gold_bracelet_elegantly_displayed_ag_4120x3504.jpeg",
		"/assets/images/bangles/12194322_A_close_up_of_a_gold_bracelet_adorned_with_diamond_2262x2216.jpeg",
		"/assets/images/bangles/12194330_Close_up_of_a_luxurious_gold_bracelet_adorned_with_3636x2875.jpeg",
		"/assets/images/bangles/12394169_Close_up_of_hands_with_beautiful_henna_and_gold_br_5472x3648.jpeg",
		"/assets/images/bangles/12865907_Elegant_still_life_of_traditional_Indian_necklace__5140x3427.jpeg",
		"/assets/images/bangles/13284499_Luxurious_gold_bangles_and_crystal_perfume_bottle__5472x3648.jpeg",
		"/assets/images/bangles/13984639_Close_up_of_detailed_henna_and_colorful_bangles_on_5760x3840.jpeg",
		"/assets/images/bangles/1456613_Close_up_of_hands_with_henna_and_jewelry_during_a__5184x3456.jpeg",
		"/assets/images/bangles/1456669_Close_up_of_a_vibrant_Indian_wedding_ceremony_show_4464x2976.jpeg",
		"/assets/images/bangles/15097582_An_intimate_moment_captured_during_a_Hindu_wedding_5184x3456.jpeg",
		"/assets/images/bangles/1616096_Close_up_of_a_variety_of_elegant_jewelry_5184x3456.jpeg",
		"/assets/images/bangles/17521718_Close_up_of_gold_bangles_on_wooden_background_with_6720x4480.jpeg",
		"/assets/images/bangles/19998653_A_beautiful_Indian_bride_in_traditional_jewelry_an_6048x3721.jpeg",
		"/assets/images/bangles/20493839_Luxurious_gold_bangles_with_intricate_designs_and__6960x4640.jpeg",
		"/assets/images/bangles/20493840_Close_up_of_gold_bangles_with_intricate_design_and_6960x4640.jpeg",
		"/assets/images/bangles/20626511_Hand_adorned_with_intricate_mehendi_and_gold_jewel_6048x4024.jpeg",
		"/assets/images/bangles/2064505_Close_up_of_ornate_henna_designs_and_traditional_j_5760x3840.jpeg",
		"/assets/images/bangles/2286400_Close_up_of_an_Indian_bride_s_hands_adorned_with_m_5472x3648.jpeg",
		"/assets/images/bangles/29357584_Chic_gold_bracelet_with_intricate_geometric_patter_5760x3840.jpeg",
		"/assets/images/bangles/29385411_Stylish_gold_bangle_featuring_a_unique_leaf_design_5760x3840.jpeg",
		"/assets/images/bangles/32170201_Close_up_of_couple_holding_hands_with_intricate_he_6720x4480.jpeg",
		"/assets/images/bangles/32455915_Elegant_South_Indian_woman_in_traditional_attire_a_6000x4000.png",
		"/assets/images/bangles/32989026_Luxurious_gold_bangles_on_a_satin_backdrop_9504x6336.jpeg",
		"/assets/images/bangles/3455741_Beautiful_moment_of_a_traditional_Indian_wedding_c_6720x4480.jpeg",
		"/assets/images/bangles/35204634_Close_up_of_a_Bengali_bride_s_hands_holding_a_deco_5760x3840.jpeg",
		"/assets/images/bangles/3641056_Close_up_of_luxurious_rose_gold_bracelet_and_lace_6000x4000.jpeg",
		"/assets/images/bangles/4155249_Close_up_of_gold_bangle_and_bracelet_on_leopard_pr_6000x4000.jpeg",
		"/assets/images/bangles/4559867_Intricate_henna_designs_and_traditional_bangles_on_5472x3648.jpeg",
		"/assets/images/bangles/5759174_Detailed_view_of_traditional_Indian_bride_hands_wi_5472x3648.jpeg",
		"/assets/images/bangles/634242_Close_up_of_a_woman_in_traditional_silver_attire_a_2048x1224.jpeg",
		"/assets/images/bangles/7685720_A_detailed_view_of_colorful_bangles_and_an_embroid_6064x4043.jpeg",
		"/assets/images/bangles/7686350_Close_up_of_vibrant_bangles_and_traditional_Indian_6064x4043.jpeg",
		"/assets/images/bangles/8601844_Close_up_of_hands_adorned_with_mehndi_and_jewelry_6000x4000.jpeg",
		"/assets/images/bangles/8828962_Close_up_of_elderly_woman_s_hands_adorned_with_jew_6000x4000.jpeg",
		"/assets/images/bangles/8886967_A_close_up_of_a_woman_s_hands_selecting_golden_ban_5040x3360.jpeg",
		"/assets/images/bangles/8886971_Vibrant_close_up_of_hands_displaying_intricate_gol_5040x3360.jpeg",
		"/assets/images/bangles/8886975_A_detailed_close_up_of_hands_delicately_holding_or_5040x3360.jpeg",
		"/assets/images/bangles/8886987_Hand_adorned_with_colorful_bangles_touching_vibran_5040x3360.jpeg",
		"/assets/images/bangles/8887000_Close_up_of_a_woman_wearing_gold_bangles_pointing__5040x3360.jpeg",
		"/assets/images/bangles/8887258_Colorful_flower_garlands_being_held_by_a_woman_ado_5040x3360.jpeg",
		"/assets/images/bangles/9808451_A_close_up_of_traditional_red_and_gold_bangles_res_6720x4480.jpeg",
	],
	rings: [
		"/assets/images/ring/-GH0bvtecE0_Pair_of_18_kt_gold_wedding_rings_por_Allec_Gomes___4224x3256.jpg",
		"/assets/images/ring/1BWZXZles_M_Top_view_of_Jewelry_5600x4480.jpg",
		"/assets/images/ring/7FjMuYYTH1A_Beautiful_wedding_rings_arranged_on_a_minimal_back_5622x3748.jpg",
		"/assets/images/ring/7yVe9kzzstU_A_couple_of_wedding_rings_sitting_on_top_of_an_ope_5472x3648.jpg",
		"/assets/images/ring/AKbE5xlIZXA_Yesterday_5413x3609 (1).jpg",
		"/assets/images/ring/AKbE5xlIZXA_Yesterday_5413x3609.jpg",
		"/assets/images/ring/BN0HcaBdPug_Wedding_rings_on_white_surface_4368x2912.jpg",
		"/assets/images/ring/Eoh1D6SXufQ_a_woman_holding_a_piece_of_food_in_her_hands_4000x3226.jpg",
		"/assets/images/ring/FQeq__7zY7c_Close_up_of_wedding_rings_4391x2927.jpg",
		"/assets/images/ring/PFFu4OmCRPY_Chopard_ring_gold_4800x3200 (1).jpg",
		"/assets/images/ring/PFFu4OmCRPY_Chopard_ring_gold_4800x3200.jpg",
		"/assets/images/ring/PVtSEz-qNhE_silver_and_gold_colored_rings_near_pink_flower_4455x3182.jpg",
		"/assets/images/ring/QUzoKEx8kuc_Two_silver_rings_on_a_dark_background_6000x4000.jpg",
		"/assets/images/ring/QYQslBvhjbM_Gold_wedding_rings__Wedding_rings_hang_on_a_flower_5886x3924.jpg",
		"/assets/images/ring/R1Gu2W37ssE_green_leaf_on_white_textile_4608x3072 (1).jpg",
		"/assets/images/ring/R1Gu2W37ssE_green_leaf_on_white_textile_4608x3072.jpg",
		"/assets/images/ring/WBHwnJHkze8_Karen_Felipe_4090x2995 (1).jpg",
		"/assets/images/ring/WBHwnJHkze8_Karen_Felipe_4090x2995.jpg",
		"/assets/images/ring/WMjCxa8wVhs_a_diamond_heart_shaped_ring_on_a_white_surface_3264x2448.jpg",
		"/assets/images/ring/ZYet8yoepik__Con_amor__3543x2353.jpg",
		"/assets/images/ring/ZzAy5phr2Pw_Weedding_rings_6000x4000.jpg",
		"/assets/images/ring/alNG6-ThXiQ_a_woman_is_putting_a_ring_on_another_woman_s_finge_6000x4000.jpg",
		"/assets/images/ring/aldDZePniqg_Gold_Jewelry_5472x3648 (1).jpg",
		"/assets/images/ring/aldDZePniqg_Gold_Jewelry_5472x3648.jpg",
		"/assets/images/ring/hNo86T4HMZM_Wedding_rings_on_bridal_veil__4938x3292.jpg",
		"/assets/images/ring/jC_S0BH_HkQ_Wedding_rings_on_wooden_ground_4985x3323.jpg",
		"/assets/images/ring/jeahglbxs6k_Le_Dori_Studio_6000x4000 (1).jpg",
		"/assets/images/ring/jeahglbxs6k_Le_Dori_Studio_6000x4000.jpg",
		"/assets/images/ring/kXA0kGuc5U8_Wedding_rings_3936x2624.jpg",
		"/assets/images/ring/lR9LqlFjcv4_Gold_wedding_rings__Hands_of_the_newlyweds__The_ha_5616x3744.jpg",
		"/assets/images/ring/m14dgwEJho8_wedding_rings_exchanged_5760x3840.jpg",
		"/assets/images/ring/o87CUS_uDiQ_3_beauty_rings_on_black_background__Diamonds_and_p_5820x3265.jpg",
		"/assets/images/ring/pBQfRqFYHrE_Shop_the_essentials_now__4__8____off_for_all_produ_4962x3308.jpg",
		"/assets/images/ring/sMHxmRxBkJQ_Two_wedding_rings_sitting_on_top_of_a_globe_5174x3449.jpg",
		"/assets/images/ring/tApn1-uuzi8_Gold_wedding_rings__Wedding_rings_on_a_crystal_ros_3861x2574.jpg",
		"/assets/images/ring/tUCYTL59cA0_gold_and_blue_ring_on_black_textile_5124x3416.jpg",
		"/assets/images/ring/ts3IgWvhLtU_Fancy_Gold_Diamond_Ring_Photography__6720x4480.jpg",
		"/assets/images/ring/xYDlYgeaBrw_gold_ring_on_white_textile_4391x2860.jpg",
		"/assets/images/ring/z3RuOvGU9ys_Rings_placed_on_park_bench_5472x3648 (1).jpg",
		"/assets/images/ring/z3RuOvGU9ys_Rings_placed_on_park_bench_5472x3648.jpg",
		"/assets/images/ring/zQBA2IhRiZA_gold_and_silver_ring_on_white_textile_4608x3072.jpg",
	],
};

const productNameTemplates = {
	anklets: [
		"Traditional Gold Plated Anklet",
		"Silver Beaded Anklet Chain",
		"Elegant Pearl Anklet",
		"Delicate Gold Anklet with Bells",
		"Antique Style Anklet",
		"Contemporary Silver Anklet",
		"Royal Gold Plated Payal",
		"Minimalist Chain Anklet",
		"Ornate Traditional Payal",
		"Ethnic Gold Anklet",
		"Designer Beaded Anklet",
		"Classic Gold Chain Anklet",
		"Vintage Style Payal",
		"Modern Geometric Anklet",
		"Bridal Gold Anklet",
		"Festive Bell Anklet",
		"Sleek Silver Payal",
		"Intricate Gold Anklet",
		"Bohemian Style Anklet",
		"Premium Gold Plated Payal",
	],
	bangles: [
		"Traditional Gold Plated Bangle Set",
		"Elegant Kada Bracelet",
		"Designer Gold Bangles",
		"Antique Finish Bangle Set",
		"Contemporary Bracelet Bangle",
		"Royal Gold Plated Kada",
		"Ethnic Bangle Collection",
		"Modern Geometric Bangles",
		"Classic Gold Bangle Set",
		"Ornate Traditional Bangles",
		"Sleek Rose Gold Bracelet",
		"Vintage Style Bangles",
		"Bridal Bangle Set",
		"Minimalist Gold Kada",
		"Intricate Pattern Bangles",
		"Festive Gold Bangle Set",
		"Premium Bracelet Bangle",
		"Delicate Chain Bracelet",
		"Bold Statement Bangles",
		"Elegant Cuff Bracelet",
	],
	rings: [
		"Classic Gold Wedding Ring",
		"Diamond Studded Engagement Ring",
		"Elegant Solitaire Ring",
		"Contemporary Band Ring",
		"Vintage Style Ring",
		"Royal Blue Gemstone Ring",
		"Minimalist Gold Band",
		"Ornate Traditional Ring",
		"Modern Geometric Ring",
		"Antique Finish Ring",
		"Delicate Pearl Ring",
		"Bold Statement Ring",
		"Sleek Silver Band",
		"Bridal Diamond Ring",
		"Ethnic Gold Ring",
		"Designer Cocktail Ring",
		"Premium Gemstone Ring",
		"Classic Engagement Ring",
		"Elegant Fashion Ring",
		"Traditional Gold Ring",
	],
};

async function main() {
	console.log(
		"🌱 Starting comprehensive database seeding from image manifest...",
	);

	// Create categories first
	const categoryMap: Map<string, string> = new Map();
	const catEntries = ["anklets", "bangles", "rings"];

	for (const catKey of catEntries) {
		let name = catKey.charAt(0).toUpperCase() + catKey.slice(1);
		const category = await prisma.category.upsert({
			where: { slug: catKey },
			update: { name: name },
			create: {
				name: name,
				slug: catKey,
				isActive: true,
			},
		});
		categoryMap.set(catKey, category.id);
		console.log(`📂 Category: ${name} (slug: ${catKey}) ensured.`);
	}

	// Seed products
	for (const [categoryKey, images] of Object.entries(imageManifest)) {
		const catId = categoryMap.get(categoryKey)!;
		const templates =
			productNameTemplates[categoryKey as keyof typeof productNameTemplates];

		console.log(`🚀 Seeding ${images.length} products for ${categoryKey}...`);

		for (let i = 0; i < images.length; i++) {
			const templateIndex = i % templates.length;
			const setNumber = Math.floor(i / templates.length) + 1;
			let productName = templates[templateIndex];
			if (setNumber > 1) {
				productName = `${productName} - Style ${setNumber}`;
			}

			const id = `${categoryKey.slice(0, 3)}-${String(i + 1).padStart(3, "0")}`;
			const slug =
				`${productName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`.slice(
					0,
					50,
				);
			const sku = `TRV-${categoryKey.toUpperCase().substring(0, 3)}-${i + 1}-${Math.random().toString(36).substring(7).toUpperCase()}`;

			// Generate price
			let price = 0;
			if (categoryKey === "anklets") price = 499 + (i % 20) * 50;
			else if (categoryKey === "bangles") price = 599 + (i % 20) * 70;
			else price = 399 + (i % 20) * 40;

			try {
				await (prisma.product as any).upsert({
					where: { slug: slug },
					update: {
						sku: sku,
						images: [images[i]],
						thumbnail: images[i],
						isActive: true,
					},
					create: {
						name: productName,
						slug: slug,
						sku: sku,
						categoryId: catId,
						price: price,
						discountPrice: Math.round(price * 0.8),
						images: [images[i]],
						thumbnail: images[i],
						description: `Beautiful ${categoryKey.slice(0, -1)} with elegant design and comfortable fit. Handcrafted premium jewellery.`,
						shortTagline: "Elegance in every detail",
						inventory: {
							quantity: 50,
							inStock: true,
						},
						specifications: {
							material: "Brass",
							plating: "1 Gram Gold",
							occasion: "Multiple",
						},
						status: "ACTIVE",
						isActive: true,
					},
				});
			} catch (error: any) {
				console.warn(
					`⚠️ Failed to seed product ${productName}: ${error.message}`,
				);
			}
		}
		console.log(`✅ ${images.length} products seeded for ${categoryKey}.`);
	}

	console.log("🚀 Comprehensive seeding completed successfully.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
