# Domain Sanitization Report: Bombay Bag House

## SECTION 1: CONTAMINATION INVENTORY
The project originally evolved from "Triveni 1 Gram Jewellers". Traces of the jewellery domain were found.
- **Schema (`schema.prisma`)**:
  - *Instance*: The `Product` model contains jewellery attributes: `platingType`.
  - *Instance*: Default badges contain "Fine Precious Metals".
  - *Instance*: Hardcoded `careInstructions` mentions "gently wipe your jewelry".
- **API Defaults (`index.ts`)**:
  - *Instance*: Root endpoint returns message `"Triveni 1 Gram Jewellers API - Enterprise Backend"`.
  - *Instance*: CORS origins list `triveni1gram.in` and related vercel domains.
- **Business Config (`schema.prisma`)**:
  - *Instance*: Default invoice prefix is `TRIVENI-INV`.

## SECTION 2: REMAINING CONTAMINATION
Architectural and structural contamination still exists in the codebase:
- **Project Name/Repo**: `trivenibombaybaghouse`
- **Database Schema**: Needs migration to remove `platingType` and update default text to bag-centric values.
- **Backend Constants**: Hardcoded strings in `index.ts` still reflect Triveni.

## SECTION 3: CLEAN PRODUCT ATTRIBUTE MODEL
To fully transition to Bombay Bag House, the product schema must adopt the following bag-native attribute model:
- **Material** (Leather, Canvas, Nylon, Vegan Leather, etc.)
- **Capacity** (in Liters)
- **Dimensions** (H x W x D in cm)
- **Compartments** (Number of compartments)
- **Closure Type** (Zipper, Magnetic, Buckle, Drawstring)
- **Strap Type** (Single, Double, Adjustable, Removable)
- **Laptop Compatibility** (Yes/No, Max size in inches)
- **Water Resistance** (Yes/No)
- **Color** 
- **Weight** (in grams)

## SECTION 4: BANNED ATTRIBUTES
The following jewellery-specific attributes must **NEVER** appear in product forms or database schema:
- Gold Weight
- Purity
- Carat / Karat
- Ring Size
- Stone / Gem / Diamond Cut
- Plating Type (Gold, Silver, Rose Gold)
- Hallmark Status
