export type SignboardAspect = 'vertical'; // 縦型ディスプレイ9:16固定

export type SignboardFrame = 'modern-black' | 'frameless' | 'aluminum-silver' | 'natural-wood' | 'gold-luxury' | 'neon-border';

export type BackgroundType = 'solid' | 'gradient' | 'pattern' | 'image' | 'video';

export type BackgroundAnimation = 
  | 'none'
  | 'pulseBreath'
  | 'floatingOrbs'
  | 'neonGlow'
  | 'scanline'
  | 'confetti'
  // ユーザー指示：グラデーション波動を削除し、新たに5種追加
  | 'aurora'          // オーロラ光彩
  | 'sunburst'        // 回転サンバースト
  | 'spotlight'       // ムービング・スポットライト
  | 'floatingBubbles' // 上昇スパークル気泡
  | 'rippleExpand'    // 同心円パルス
  // 過去データの互換用
  | 'gradientShift'
  | 'waveMotion';

export type TextAnimation = 
  | 'none'
  | 'slideUp'
  | 'slideLeft'
  | 'slideRight'
  | 'bounce'
  | 'zoomIn'
  | 'pulse'
  | 'shake'
  | 'flip'
  | 'neonFlicker'
  | 'sway';

// ユーザー指示：文字のアニメーションの動きの速さを３段階で選択できるように
export type TextAnimationSpeed = 'slow' | 'normal' | 'fast';

export type FontFamily = 
  | 'Noto Sans JP'
  | 'M PLUS Rounded 1c'
  | 'RocknRoll One'
  | 'Dela Gothic One'
  | 'Shippori Mincho'
  | 'Zen Maru Gothic'
  | 'Kaisei Decol'
  | 'Zen Antique'
  | 'Klee One'
  | 'Yuji Boku'
  | 'Reggae One'
  | 'Potta One'
  | 'Stick'
  | 'Yomogi'
  | 'DotGothic16';

export type TextTarget = 'headline' | 'subheadline' | 'shopName' | 'categoryBadge' | 'menu' | 'footer' | 'all';

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  priceBgColor?: string; // 金額の背景色
  imageUrl?: string;
  featured?: boolean;
  namePt?: number; // 商品名フォントサイズ個別指定
  descPt?: number; // 紹介文フォントサイズ個別指定
  pricePt?: number; // 金額フォントサイズ個別指定
}

export interface SignageSlide {
  id: string;
  name: string;
  duration: number; // 秒数: 5, 10, 15, 20, 25, 30, 40, 50, 60
  // 看板
  aspect: SignboardAspect;
  frame: SignboardFrame;
  // 背景
  bgType: BackgroundType;
  bgColor: string;
  bgGradient: string;
  bgPattern: string; // 'none' | 'dots' | 'grid' | 'stripes' | 'wood'
  bgCustomImage?: string;
  bgVideoUrl?: string;
  bgAnimation: BackgroundAnimation;
  bgAnimationSpeed?: 'slow' | 'normal' | 'fast'; // ユーザー指示：動く背景エフェクトのスピード選択 (slow, normal, fast)
  textColor: string;
  accentColor: string;
  // コンテンツ
  shopName: string;
  shopNameSize?: 'small' | 'medium' | 'large'; // 店舗名フォントサイズ: 互換用
  shopNamePt?: number; // ユーザー指示：自分でポイント数を選べるように (pt/px)
  shopLogoUrl?: string; // 店舗ロゴ画像
  categoryBadge: string;
  categoryBadgePt?: number; // バッジポイント数
  headline: string;
  headlineSize?: 'small' | 'medium' | 'large'; // メインキャッチコピー: 互換用
  headlinePt?: number; // ユーザー指示：自分でポイント数を選べるように (pt/px)
  subheadline: string;
  subheadlineSize?: 'small' | 'medium' | 'large'; // サブコピー: 互換用
  subheadlinePt?: number; // ユーザー指示：自分でポイント数を選べるように (pt/px)
  subheadlineImageUrl?: string; // ユーザー指示：サブコピーの下に画像を入れる機能
  subheadlineImages?: string[]; // ユーザー指示：画像（1枚または互換用配列）
  menuItems: MenuItem[]; // 最大6品まで
  menuItemNamePt?: number; // メニュー商品名一括フォントサイズ
  menuItemDescPt?: number; // メニュー紹介文一括フォントサイズ
  menuItemPricePt?: number; // メニュー価格一括フォントサイズ
  footerNote: string;
  showQrCode: boolean;
  qrCodeUrl: string;
  qrCodeLabel: string;
  // スタイル
  fontFamily: FontFamily;
  fontOverrides?: {
    headline?: FontFamily;
    subheadline?: FontFamily;
    shopName?: FontFamily;
    categoryBadge?: FontFamily;
    menu?: FontFamily;
    footer?: FontFamily;
  };
  textAnimation: TextAnimation;
  textAnimationSpeed?: TextAnimationSpeed; // ユーザー指示：３段階速度 (slow, normal, fast)
  headlineAlign?: 'left' | 'center' | 'right'; // ユーザー指示：メインコピー配置
  subheadlineAlign?: 'left' | 'center' | 'right'; // ユーザー指示：サブコピー配置
  shopNameAlign?: 'left' | 'center' | 'right'; // ユーザー指示：店舗名・ブランド名配置（左中右揃え）
  layoutStyle: 'center-bold' | 'split-menu' | 'card-grid' | 'poster-hero';
  writingMode?: 'horizontal' | 'vertical'; // ユーザー指示：縦書き機能
}

export interface SignageFolder {
  id: string;
  name: string;
  slides: SignageSlide[];
  updatedAt: string;
}

export type StepKey = 
  | 'step1_folders'     // ① 看板フォルダ一覧 (X/20)
  | 'step2_signboard'   // ② デザイン (デザイン選択画面)
  | 'step3_background'  // ③ 背景
  | 'step4_content'     // ④ 書体
  | 'step5_shopname'    // ⑤ 店舗名
  | 'step6_copy'        // ⑥ コピー
  | 'step7_items'       // ⑦ 商品
  | 'step8_typography'  // ⑧ 文字の動き
  | 'step9_delivery';   // ⑨ サイネージ配信

export const FRAME_OPTIONS: { id: SignboardFrame; name: string; color: string }[] = [
  { id: 'modern-black', name: 'ブラック', color: '#0f172a' },
  { id: 'frameless', name: 'フレームレス', color: '#64748b' },
  { id: 'aluminum-silver', name: 'シルバー', color: '#cbd5e1' },
  { id: 'natural-wood', name: '木目ウッド', color: '#854d0e' },
  { id: 'gold-luxury', name: 'ゴールド', color: '#f59e0b' },
  { id: 'neon-border', name: 'サイバーネオン', color: '#06b6d4' },
];

export interface ColorCategory {
  id: string;
  name: string;
  description?: string;
  colors: {
    name: string;
    value: string;
    textColor: string;
    accentColor: string;
    isPastel?: boolean;
    isWhite?: boolean;
  }[];
}

// ユーザー指示「何かのエラーの場合は、理由と解決方法を明示」
export interface AppError {
  title: string;
  reason: string;
  solution: string;
  details?: string;
}
