import type { ImageSource } from 'expo-image';

/**
 * Editorial photography assets for Home and Explore screens.
 * Sourced/generated for GlamQuote AI Phase 1.
 */
export const homeImages = {
  nailStudio: require('./home/nail-studio.jpg') as ImageSource,
  hairStudio: require('./home/hair-studio.jpg') as ImageSource,
};

export const exploreImages = {
  hairStudio: require('./explore/hair-studio.jpg') as ImageSource,
  nailStudio: require('./explore/nail-studio.jpg') as ImageSource,
  styleE1: require('./explore/style-e1-soft-twist-out.jpg') as ImageSource,
  styleE2: require('./explore/style-e2-milky-nude-square.jpg') as ImageSource,
  styleE3: require('./explore/style-e3-textured-crop.jpg') as ImageSource,
  styleE4: require('./explore/style-e4-plum-chrome-almond.jpg') as ImageSource,
  styleE5: require('./explore/style-e5-curtain-fringe-shag.jpg') as ImageSource,
  styleE6: require('./explore/style-e6-matte-neutral-short.jpg') as ImageSource,
};

/**
 * Editorial and catalogue photography assets for Nail Studio.
 * Sourced/generated for GlamQuote AI Phase 2.
 */
export const nailStudioImages = {
  hero: require('./nail-studio/hero-champagne-chrome.jpg') as ImageSource,
  curated: {
    milkyNude: require('./nail-studio/curated-milky-nude.jpg') as ImageSource,
    taupeMatte: require('./nail-studio/curated-taupe-matte.jpg') as ImageSource,
    classicFrench: require('./nail-studio/curated-classic-french.jpg') as ImageSource,
    plumMicroFrench: require('./nail-studio/curated-plum-micro-french.jpg') as ImageSource,
    plumChrome: require('./nail-studio/curated-plum-chrome.jpg') as ImageSource,
    champagneChrome: require('./nail-studio/curated-champagne-chrome.jpg') as ImageSource,
    goldDot: require('./nail-studio/curated-gold-dot.jpg') as ImageSource,
    fineLine: require('./nail-studio/curated-fine-line.jpg') as ImageSource,
  },
};
/**
 * Editorial and catalogue photography assets for Hair Studio & Hair Color Studio.
 * Sourced/generated for GlamQuote AI Phase 3.
 */
export const hairStudioImages = {
  hero: require('./hair-studio/hero/hero-hair-studio.jpg') as ImageSource,
  colorHero: require('./hair-studio/hero/hero-hair-color.jpg') as ImageSource,
  hairstyles: {
    chinLengthBob: require('./hair-studio/hairstyles/chin-length-bob.jpg') as ImageSource,
    longSoftLayers: require('./hair-studio/hairstyles/long-soft-layers.jpg') as ImageSource,
    definedCurls: require('./hair-studio/hairstyles/defined-curls.jpg') as ImageSource,
    texturedCrop: require('./hair-studio/hairstyles/textured-crop.jpg') as ImageSource,
    shortFade: require('./hair-studio/hairstyles/short-fade.jpg') as ImageSource,
    shoulderLocs: require('./hair-studio/hairstyles/shoulder-locs.jpg') as ImageSource,
  },
  hairColors: {
    honeyBlonde: require('./hair-studio/hair-colors/honey-blonde.jpg') as ImageSource,
    chocolateBrown: require('./hair-studio/hair-colors/chocolate-brown.jpg') as ImageSource,
    copperRed: require('./hair-studio/hair-colors/copper-red.jpg') as ImageSource,
    roseGold: require('./hair-studio/hair-colors/rose-gold.jpg') as ImageSource,
    ombreCaramel: require('./hair-studio/hair-colors/ombre-caramel.jpg') as ImageSource,
    ombreRoseGoldPeach: require('./hair-studio/hair-colors/ombre-rose-gold-peach.jpg') as ImageSource,
  },
};

/**
 * Editorial photography assets for Onboarding and Guest Welcome screens.
 * Sourced/generated for GlamQuote AI Phase 4.
 */
export const onboardingImages = {
  welcome: require('./onboarding/welcome-hero.jpg') as ImageSource,
  discover: {
    d1ManTwists: require('./onboarding/discover-d1-man-twists.jpg') as ImageSource,
    d2MilkyNude: require('./nail-studio/curated-milky-nude.jpg') as ImageSource,
    d3SilverWaves: require('./onboarding/discover-d3-silver-waves.jpg') as ImageSource,
  },
  tryOn: {
    t1Original: require('./onboarding/try-on-t1-original.jpg') as ImageSource,
    t2Preview: require('./explore/style-e5-curtain-fringe-shag.jpg') as ImageSource,
  },
  compare: {
    c1LookA: require('./onboarding/compare-c1-look-a.jpg') as ImageSource,
    c2LookB: require('./onboarding/compare-c2-look-b.jpg') as ImageSource,
  },
};
