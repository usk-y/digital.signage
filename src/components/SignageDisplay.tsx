import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SignageSlide, TextTarget } from '../types';
import { Sparkles, Type, QrCode, ImageIcon } from 'lucide-react';
import {
  calculateAutoHeadlinePt,
  calculateAutoSubheadlinePt,
  calculateAutoMenuItemNamePt,
  calculateAutoMenuItemDescPt,
  calculateAutoMenuItemPricePt,
} from '../utils/typography';
import { handleImageError } from '../utils/imageFallback';

interface SignageDisplayProps {
  slide: SignageSlide;
  scale?: number;
  interactive?: boolean;
  isFullscreen?: boolean;
  selectedTextTarget?: TextTarget;
  onSelectTextTarget?: (target: TextTarget) => void;
}

export const SignageDisplay: React.FC<SignageDisplayProps> = ({
  slide,
  scale = 1,
  isFullscreen = false,
  selectedTextTarget,
  onSelectTextTarget,
}) => {
  const [qrImgError, setQrImgError] = useState(false);

  // フレームクラス
  const getFrameClasses = () => {
    if (isFullscreen) return 'rounded-none border-0 shadow-none';
    switch (slide.frame) {
      case 'modern-black':
        return 'border-[14px] border-slate-900 rounded-3xl shadow-2xl ring-1 ring-slate-800';
      case 'frameless':
        return 'border-0 rounded-2xl shadow-2xl';
      case 'aluminum-silver':
        return 'border-[16px] border-slate-300 rounded-2xl shadow-2xl ring-2 ring-slate-400 bg-slate-200';
      case 'natural-wood':
        return 'border-[18px] border-[#854d0e] rounded-2xl shadow-2xl ring-2 ring-[#713f12] bg-[#a16207]';
      case 'gold-luxury':
        return 'border-[16px] border-amber-400 rounded-2xl shadow-2xl ring-2 ring-amber-500 bg-amber-200';
      case 'neon-border':
        return 'border-[8px] border-cyan-400 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.8)]';
      default:
        return 'border-[14px] border-slate-900 rounded-3xl shadow-2xl';
    }
  };

  // 各パーツのフォント取得ヘルパー（特太インパクトは高視認性のRocknRoll Oneを適用）
  const getTargetFont = (target: TextTarget): string => {
    const override = slide.fontOverrides?.[target as keyof typeof slide.fontOverrides];
    const family = override || slide.fontFamily || 'Noto Sans JP';
    return `'${family}', sans-serif`;
  };

  // 背景スタイル
  const getBackgroundStyle = (): React.CSSProperties => {
    if (slide.bgType === 'gradient') {
      return { background: slide.bgGradient };
    }
    if (slide.bgType === 'image' && slide.bgCustomImage) {
      return {
        backgroundImage: `url(${slide.bgCustomImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: slide.bgColor };
  };

  const getPatternClass = () => {
    if (slide.bgPattern === 'dots') return 'pattern-dots';
    if (slide.bgPattern === 'grid') return 'pattern-grid';
    if (slide.bgPattern === 'stripes') return 'pattern-stripes';
    if (slide.bgPattern === 'wood') return 'pattern-wood';
    return '';
  };

  // テキストアニメーション用 Motion バリアント（デフォルト速度：標準）
  const getTextAnimationVariants = () => {
    const speed = slide.textAnimationSpeed || 'normal';
    const mult = speed === 'slow' ? 6.0 : speed === 'fast' ? 1.0 : 3.0;

    switch (slide.textAnimation) {
      case 'slideUp':
        return {
          initial: { opacity: 0, y: 100 },
          animate: { opacity: 1, y: 0, transition: { duration: 1.5 * mult, ease: 'easeOut' as const } },
        };
      case 'slideLeft':
        return {
          initial: { opacity: 0, x: -100 },
          animate: { opacity: 1, x: 0, transition: { duration: 1.5 * mult, ease: 'easeOut' as const } },
        };
      case 'slideRight':
        return {
          initial: { opacity: 0, x: 100 },
          animate: { opacity: 1, x: 0, transition: { duration: 1.5 * mult, ease: 'easeOut' as const } },
        };
      case 'bounce':
        return {
          initial: { opacity: 0, scale: 0.3, y: -80 },
          animate: {
            opacity: 1,
            scale: [0.3, 1.2, 0.95, 1],
            y: 0,
            transition: { duration: 0.8 * mult, times: [0, 0.5, 0.8, 1] },
          },
        };
      case 'zoomIn':
        return {
          initial: { opacity: 0, scale: 0.2 },
          animate: { opacity: 1, scale: 1, transition: { duration: 0.7 * mult, ease: 'easeOut' as const } },
        };
      case 'pulse':
        return {
          initial: { scale: 1 },
          animate: {
            scale: [1, 1.1, 1, 1.14, 1],
            transition: { repeat: Infinity, duration: 2.2 * mult, ease: 'easeInOut' as const },
          },
        };
      case 'shake':
        return {
          initial: { x: 0 },
          animate: {
            x: [0, -10, 10, -8, 8, -4, 4, 0],
            transition: { repeat: Infinity, duration: 2.6 * mult, repeatDelay: 1.2 * mult },
          },
        };
      case 'flip':
        return {
          initial: { opacity: 0, rotateX: 90 },
          animate: { opacity: 1, rotateX: 0, transition: { duration: 0.8 * mult, ease: 'easeOut' as const } },
        };
      case 'neonFlicker':
        return {
          initial: { opacity: 1 },
          animate: {
            opacity: [1, 0.15, 1, 0.05, 1, 0.4, 1],
            transition: { repeat: Infinity, duration: 2.6 * mult, repeatDelay: 0.8 * mult },
          },
        };
      case 'sway':
        return {
          initial: { rotate: 0 },
          animate: {
            rotate: [-5, 5, -5],
            transition: { repeat: Infinity, duration: 3.2 * mult, ease: 'easeInOut' as const },
          },
        };
      default:
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
        };
    }
  };

  // QRコード生成API用URL
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    slide.qrCodeUrl || 'https://google.com'
  )}&bgcolor=ffffff&color=000000`;

  // テキストクリック時の選択枠スタイルヘルパー
  const getSelectableClass = (target: TextTarget) => {
    if (isFullscreen || !onSelectTextTarget) return '';
    const isSelected = selectedTextTarget === target;
    return `cursor-pointer transition-all rounded-xl relative group ${
      isSelected
        ? 'ring-2 ring-amber-400 bg-amber-400/15 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
        : 'hover:ring-1 hover:ring-amber-400/60 hover:bg-white/5'
    }`;
  };



  // 店舗名のフォントサイズ選択（小・中・大）
  const getShopNameSizeClass = () => {
    switch (slide.shopNameSize) {
      case 'small':
        return 'text-[18px]';
      case 'large':
        return 'text-[28px]';
      case 'medium':
      default:
        return 'text-[22px]';
    }
  };

  // ユーザー指示「添付の部分、文字数が多くなったら改行して形を縦長に自動変更」
  const badgeText = slide.categoryBadge || '';
  const isBadgeTall = badgeText.length > 9 || badgeText.includes('\n');

  // メニュー商品数（最大6品）に応じた動的レイアウト設定
  const itemCount = slide.menuItems?.length || 0;
  const isDenseMenu = itemCount >= 5;
  const isMediumMenu = itemCount === 4;

  const isVertical = slide.writingMode === 'vertical';
  const visibleItems = (slide.menuItems || []).slice(0, 6);
  const visibleCount = visibleItems.length;

  // ユーザー指示「メインキャッチコピーは最大52ptまで、サブコピーは最大26ptまで」
  // ユーザー指示「ptを自動にして表示されるpt数と実際のpt数が異なる」不具合を解消
  const effectiveHeadlinePt =
    slide.headlinePt && slide.headlinePt > 0
      ? Math.min(52, slide.headlinePt)
      : calculateAutoHeadlinePt(slide.headline || '', isVertical, slide.headlineSize);

  const effectiveSubheadlinePt =
    slide.subheadlinePt && slide.subheadlinePt > 0
      ? Math.min(26, slide.subheadlinePt)
      : calculateAutoSubheadlinePt(slide.subheadline || '', isVertical, slide.subheadlineSize);

  const autoItemNamePt = calculateAutoMenuItemNamePt(visibleCount, isVertical);
  const autoItemDescPt = calculateAutoMenuItemDescPt(visibleCount, isVertical);
  const autoItemPricePt = calculateAutoMenuItemPricePt(visibleCount, isVertical);

  const effectiveItemNamePt =
    slide.menuItemNamePt && slide.menuItemNamePt > 0
      ? slide.menuItemNamePt
      : autoItemNamePt;

  const effectiveItemDescPt =
    slide.menuItemDescPt && slide.menuItemDescPt > 0
      ? slide.menuItemDescPt
      : autoItemDescPt;

  const effectiveItemPricePt =
    slide.menuItemPricePt && slide.menuItemPricePt > 0
      ? slide.menuItemPricePt
      : autoItemPricePt;

  return (
    /* 外側コンテナ：スケール後の正確なピクセル専有サイズを確保 */
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        width: `${540 * scale}px`,
        height: `${960 * scale}px`,
      }}
    >
      {/* 540x960 基準キャンバス本体 */}
      <div
        style={{
          width: '540px',
          height: '960px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          fontFamily: `'${slide.fontFamily}', sans-serif`,
        }}
        className={`absolute top-0 left-0 overflow-hidden flex flex-col ${getFrameClasses()}`}
      >
        {/* 背景動画レイヤー */}
        {slide.bgType === 'video' && slide.bgVideoUrl && (
          <video
            src={slide.bgVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          />
        )}

        {/* 背景色・グラデーション・画像レイヤー */}
        {slide.bgType !== 'video' && (
          <div
            className={`absolute inset-0 z-0 transition-colors duration-500 ${getPatternClass()}`}
            style={getBackgroundStyle()}
          />
        )}

        {/* コンテンツエリア */}
        <div
          className="relative z-10 flex-1 flex flex-col justify-center gap-6 p-5 pb-5 overflow-hidden h-full min-h-0"
          style={{ color: slide.textColor }}
        >
          {/* 
            ヘッダー部：
            ユーザー指示：
            1. 店舗名・ブランド名とカテゴリーバッジは左右表示
            2. 各項目でテキストは中央揃え＆改行対応
            3. 店舗名・ブランド名のフォントの大きさを選べるように＆画像を添付できるように（お店のロゴ）
            4. カテゴリーバッジは文字数が多くなったら改行して形を縦長に自動変更
          */}
          <div
            className={`shrink-0 flex items-center gap-3 border-b pb-3 mb-2.5 w-full ${
              !slide.categoryBadge
                ? slide.shopNameAlign === 'right'
                  ? 'justify-end'
                  : slide.shopNameAlign === 'center'
                  ? 'justify-center'
                  : 'justify-start'
                : 'justify-between'
            }`}
            style={{ borderColor: `${slide.textColor}25` }}
          >
            {/* 店舗名・ブランド名 ＆ お店のロゴ（左揃え・中央揃え・右揃え独立設定対応） */}
            <div
              onClick={() => onSelectTextTarget?.('shopName')}
              className={`flex items-center gap-2.5 p-1 ${
                slide.shopNameAlign === 'right'
                  ? 'justify-end text-right'
                  : slide.shopNameAlign === 'center'
                  ? 'justify-center text-center'
                  : 'justify-start text-left'
              } ${slide.categoryBadge ? 'flex-1' : ''} ${getSelectableClass('shopName')}`}
              style={{
                fontFamily: getTargetFont('shopName'),
                justifyContent:
                  slide.shopNameAlign === 'right'
                    ? 'flex-end'
                    : slide.shopNameAlign === 'center'
                    ? 'center'
                    : 'flex-start',
              }}
              title="クリックして店舗名の書体を変更"
            >
              {/* お店のロゴ画像（透明背景でベゼルなし縮小表示） */}
              {slide.shopLogoUrl ? (
                <div className="w-[64px] h-[64px] rounded-lg bg-transparent flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.shopLogoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slide.accentColor }}
                />
              )}

              <span
                className={`font-bold tracking-wider opacity-95 whitespace-pre-line leading-tight max-w-[280px] ${
                  slide.shopNameAlign === 'right'
                    ? 'text-right'
                    : slide.shopNameAlign === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${getShopNameSizeClass()}`}
                style={{ textAlign: slide.shopNameAlign || 'left' }}
              >
                {slide.shopName || 'SHOP NAME'}
              </span>

              {selectedTextTarget === 'shopName' && (
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded ml-1 shrink-0">
                  選択中
                </span>
              )}
            </div>

            {/* カテゴリーバッジ（右上ラベル配置） */}
            {slide.categoryBadge && (
              <div
                onClick={() => onSelectTextTarget?.('categoryBadge')}
                className={`p-1 shrink-0 flex items-center justify-center text-center ${getSelectableClass('categoryBadge')}`}
                style={{ fontFamily: getTargetFont('categoryBadge') }}
                title="クリックしてバッジの書体を変更"
              >
                <div
                  className={`font-black tracking-wider shadow-sm uppercase text-center flex items-center justify-center transition-all ${
                    isBadgeTall
                      ? 'rounded-2xl px-3.5 py-2 leading-tight max-w-[150px] whitespace-pre-line break-words text-[12px]'
                      : 'rounded-full px-4 py-1.5 leading-snug whitespace-pre-line text-[13px]'
                  }`}
                  style={{
                    backgroundColor: slide.accentColor,
                    color:
                      slide.bgColor === '#ffffff' || slide.bgColor === '#f8fafc' || slide.bgColor === '#fefce8'
                        ? '#ffffff'
                        : '#0f172a',
                  }}
                >
                  <span className="text-center whitespace-pre-line">{slide.categoryBadge}</span>
                </div>
              </div>
            )}
          </div>

          {/* 縦書き時と横書き時のレイアウト分岐 */}
          {slide.writingMode === 'vertical' ? (
            <div className="flex-1 flex flex-row items-stretch justify-between gap-3 min-h-0 h-full py-0.5 overflow-hidden">
              {/* 1. 商品エリア（上部に画像最大1コマ・横幅いっぱい・縦幅1.5倍、下部に商品リスト）
                  ユーザー指示: 「商品リストの幅は狭めないように」
                  幅を w-[330px] shrink-0 で固定保護し、文字数が増えても商品リストの幅は絶対に狭めない */}
              <div className="w-[330px] shrink-0 flex flex-col justify-between gap-2 min-h-0 h-full">
                {/* 画像: 枠ギリギリまでアップして表示（object-cover）＆ キャッチコピー・サブコピーと一緒にアニメーション */}
                {(() => {
                  const verticalBannerImg = slide.subheadlineImageUrl || (slide.subheadlineImages && slide.subheadlineImages[0]);
                  if (!verticalBannerImg) return null;
                  return (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`v-img-${slide.id || ''}-${slide.headline || ''}-${slide.subheadline || ''}-${slide.textAnimation || 'none'}-${verticalBannerImg}`}
                        variants={getTextAnimationVariants()}
                        initial="initial"
                        animate="animate"
                        className="w-full max-w-[326px] h-[120px] rounded-2xl bg-transparent overflow-hidden flex items-center justify-center shrink-0 mx-auto mb-1"
                      >
                        <img
                          src={verticalBannerImg}
                          alt="参考画像"
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                          className="w-auto h-auto max-w-full max-h-full object-contain rounded-xl drop-shadow-sm"
                        />
                      </motion.div>
                    </AnimatePresence>
                  );
                })()}

                {/* 商品リスト: レスポンシブ配置
                    ユーザー指示:
                    1. 商品リストは中央揃えにして、１つだと商品リストスペースの中での中央。２個目、３個目は左右幅を均等に。
                    2. 商品を１つだけ入れた場合は、フッターの上まで表示
                    3. 商品リストに画像を入れない場合は文字を上まで入れるように
                    4. 価格を入れない場合は枠も表示させないように
                    5. 商品名、商品紹介文も文字ptを任意で変えられるように
                */}
                {visibleCount > 0 && (
                  <div
                    onClick={() => onSelectTextTarget?.('menu')}
                    className={`flex-1 ${
                      visibleCount === 1
                        ? 'flex justify-center items-stretch'
                        : visibleCount === 2
                        ? 'grid grid-cols-2 grid-rows-1'
                        : visibleCount === 3
                        ? 'grid grid-cols-3 grid-rows-1'
                        : visibleCount === 4
                        ? 'grid grid-cols-2 grid-rows-2'
                        : 'grid grid-cols-3 grid-rows-2'
                    } gap-1.5 min-h-0 p-1 items-stretch ${getSelectableClass('menu')}`}
                    style={{
                      direction: 'rtl',
                      fontFamily: getTargetFont('menu'),
                    }}
                    title="クリックしてメニュー商品の書体を変更"
                  >
                    {visibleItems.map((item, idx) => {
                      const itemEffectiveNamePt = item.namePt || slide.menuItemNamePt || autoItemNamePt;
                      const itemEffectiveDescPt = item.descPt || slide.menuItemDescPt || autoItemDescPt;
                      const itemEffectivePricePt = item.pricePt || slide.menuItemPricePt || autoItemPricePt;

                      return (
                        <motion.div
                          key={item.id || idx}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 + idx * 0.03, duration: 0.15 }}
                          className={`relative rounded-xl border backdrop-blur-sm transition-all flex flex-col items-center justify-between shadow-sm ${
                            visibleCount === 1
                              ? 'w-full max-w-[260px] h-full p-3.5 gap-2.5 mx-auto'
                              : visibleCount >= 4
                              ? 'p-1 sm:p-1.5 gap-0.5 overflow-hidden'
                              : 'p-1.5 sm:p-2 gap-1 overflow-hidden'
                          } ${item.featured ? 'scale-[1.01] ring-2' : ''}`}
                          style={{
                            direction: 'ltr',
                            backgroundColor: `${slide.textColor}10`,
                            borderColor: `${slide.textColor}25`,
                            boxShadow: item.featured ? `0 0 0 2px ${slide.accentColor}` : undefined,
                          }}
                        >
                          {/* 商品の写真（画像がある場合のみ表示。縮小時のベゼルは完全透明） */}
                          {item.imageUrl && (
                            <div
                              className={`${
                                visibleCount === 1
                                  ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shrink-0'
                                  : visibleCount === 2
                                  ? 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl shrink-0'
                                  : visibleCount >= 4
                                  ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0'
                                  : 'w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0'
                              } bg-transparent flex items-center justify-center overflow-hidden`}
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                onError={handleImageError}
                                className="max-w-full max-h-full object-contain rounded-lg"
                              />
                            </div>
                          )}

                          {/* 商品名（右側）と紹介文（左側）、タグバッジは一番右の縦列に配置 */}
                          <div className={`flex-1 w-full flex flex-row-reverse items-stretch justify-center ${visibleCount >= 4 ? 'gap-0.5' : 'gap-1.5'} min-h-0 py-0.5 overflow-hidden`}>
                            {/* タグバッジ（縦書き）: 最右端に独立して配置し、レイアウト崩れを完全に防止 */}
                            {item.tag && (
                              <div
                                className={`shrink-0 rounded text-white font-bold ${
                                  visibleCount === 1
                                    ? 'text-[10px] px-1.5 py-1'
                                    : visibleCount >= 4
                                    ? 'text-[7px] px-0.5 py-0.5'
                                    : 'text-[8.5px] px-1 py-1'
                                } shadow-xs tracking-wider flex items-center justify-center whitespace-nowrap self-start`}
                                style={{
                                  backgroundColor: item.tagColor || slide.accentColor,
                                  writingMode: 'vertical-rl',
                                  textOrientation: 'upright',
                                }}
                              >
                                {item.tag}
                              </div>
                            )}

                            {/* 商品名（縦書き）: タグの左隣（または右端） */}
                            <div className="shrink-0 flex items-start self-start h-full max-h-full overflow-hidden">
                              <span
                                className="font-bold break-words leading-tight"
                                style={{
                                  fontSize: `${itemEffectiveNamePt}px`,
                                  writingMode: 'vertical-rl',
                                  textOrientation: 'upright',
                                  letterSpacing: visibleCount >= 4 ? '0.01em' : '0.04em',
                                  maxHeight: '100%',
                                }}
                              >
                                {item.name}
                              </span>
                            </div>

                            {/* 商品紹介文（縦書き）: 商品名のさらに左 */}
                            {item.description && (
                              <p
                                className="opacity-80 break-words leading-tight whitespace-pre-line self-start h-full overflow-hidden flex-1 min-w-0"
                                style={{
                                  fontSize: `${itemEffectiveDescPt}px`,
                                  writingMode: 'vertical-rl',
                                  textOrientation: 'upright',
                                  letterSpacing: visibleCount >= 4 ? '0em' : '0.02em',
                                  maxHeight: '100%',
                                  maxWidth: visibleCount >= 5 ? '38px' : visibleCount === 4 ? '46px' : undefined,
                                }}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* 価格（下側） - デフォルト透明背景、ブランク時は半透明ガイド表示 */}
                          {item.price && item.price.trim().length > 0 ? (
                            <div className="shrink-0 pt-0.5 pb-0.5 w-full flex items-center justify-center">
                              <div
                                className={`rounded-md flex items-center justify-center ${
                                  visibleCount >= 4 ? 'px-1.5 py-0.5' : 'px-2 py-0.5'
                                } ${
                                  item.priceBgColor && item.priceBgColor !== 'transparent'
                                    ? 'border border-slate-300/50 shadow-xs'
                                    : 'border border-transparent'
                                }`}
                                style={{
                                  backgroundColor: item.priceBgColor && item.priceBgColor !== 'transparent' ? item.priceBgColor : 'transparent',
                                }}
                              >
                                <span
                                  className="font-black tracking-tight whitespace-nowrap leading-none flex items-center justify-center -translate-y-[0.5px]"
                                  style={{
                                    fontSize: `${itemEffectivePricePt}px`,
                                    color: slide.accentColor || '#1e293b',
                                  }}
                                >
                                  {item.price}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2 & 3. コピーエリア（中央：サブコピー、右：大見出し）
                  ユーザー指示:
                  1. 「メインキャッチコピーとサブコピーはもっと右寄りにして」
                  2. 「縦書きにした場合、メインキャッチコピーとサブコピーは左中右揃えでなく、上中下揃えに変更」
                  3. 「メインキャッチコピーは最大52ptまで、サブコピーは最大26ptまで」
              */}
              <div className="flex-1 min-w-0 flex flex-row-reverse items-stretch justify-start gap-2.5 sm:gap-3.5 h-full max-h-full py-0.5 overflow-hidden pr-0 pl-1">
                {/* 3. 大見出し（一番右） */}
                <div
                  onClick={() => onSelectTextTarget?.('headline')}
                  className={`p-0.5 sm:p-1 shrink-0 max-h-full h-full flex flex-col items-center ${
                    slide.headlineAlign === 'left'
                      ? 'justify-start'
                      : slide.headlineAlign === 'right'
                      ? 'justify-end'
                      : 'justify-center'
                  } mr-0 ${getSelectableClass('headline')}`}
                  title="クリックして大見出しの書体を変更"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`v-headline-${slide.id || ''}-${slide.headline || ''}-${slide.subheadline || ''}-${slide.textAnimation || 'none'}`}
                      variants={getTextAnimationVariants()}
                      initial="initial"
                      animate="animate"
                      className="h-full flex flex-col items-center justify-center"
                    >
                      <h1
                        className="font-black tracking-tight drop-shadow-sm whitespace-pre-line break-words"
                        style={{
                          fontFamily: getTargetFont('headline'),
                          color: slide.textColor,
                          fontSize: `${effectiveHeadlinePt}px`,
                          lineHeight: 1.15,
                          textAlign: slide.headlineAlign === 'left' ? 'start' : slide.headlineAlign === 'right' ? 'end' : 'center',
                          writingMode: 'vertical-rl',
                          textOrientation: 'upright',
                          maxHeight: '100%',
                          textShadow:
                            slide.textAnimation === 'neonFlicker'
                              ? `0 0 16px ${slide.accentColor}, 0 0 32px ${slide.accentColor}`
                              : 'none',
                        }}
                      >
                        {slide.headline || 'キャッチコピーを入力'}
                      </h1>
                    </motion.div>
                  </AnimatePresence>
                  {selectedTextTarget === 'headline' && (
                    <div className="inline-flex items-center gap-1 text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded-full mt-1 shrink-0 whitespace-nowrap">
                      <Type className="w-3 h-3" /> 見出し変更中
                    </div>
                  )}
                </div>

                {/* 2. サブコピー（大見出しの左） */}
                {slide.subheadline && (
                  <div
                    onClick={() => onSelectTextTarget?.('subheadline')}
                    className={`p-0.5 sm:p-1 shrink-0 max-h-full h-full flex flex-col items-center ${
                      slide.subheadlineAlign === 'left'
                        ? 'justify-start'
                        : slide.subheadlineAlign === 'right'
                        ? 'justify-end'
                        : 'justify-center'
                    } ${getSelectableClass('subheadline')}`}
                    title="クリックして説明文の書体を変更"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`v-sub-${slide.id || ''}-${slide.headline || ''}-${slide.subheadline || ''}-${slide.textAnimation || 'none'}`}
                        variants={getTextAnimationVariants()}
                        initial="initial"
                        animate="animate"
                        className="h-full flex flex-col items-center justify-center"
                      >
                        <p
                          className="font-medium opacity-85 whitespace-pre-line break-words"
                          style={{ 
                            fontFamily: getTargetFont('subheadline'),
                            fontSize: `${effectiveSubheadlinePt}px`,
                            lineHeight: 1.25,
                            textAlign: slide.subheadlineAlign === 'left' ? 'start' : slide.subheadlineAlign === 'right' ? 'end' : 'center',
                            writingMode: 'vertical-rl',
                            textOrientation: 'upright',
                            maxHeight: '100%',
                          }}
                        >
                          {slide.subheadline}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 横書き時の既存レイアウト */
            <>
              {/* メイン見出し＆サブタイトル */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${slide.headline}-${slide.textAnimation}`}
                  variants={getTextAnimationVariants()}
                  initial="initial"
                  animate="animate"
                  className={`text-center py-1 shrink-0 ${itemCount >= 5 ? 'my-1' : 'my-auto'}`}
                >
                  {/* 大見出し */}
                  <div
                    onClick={() => onSelectTextTarget?.('headline')}
                    className={`p-1 ${getSelectableClass('headline')}`}
                    title="クリックして大見出しの書体を変更"
                  >
                    <h1
                      className="font-black tracking-tight mb-1.5 drop-shadow-sm whitespace-pre-line break-words"
                      style={{
                        fontFamily: getTargetFont('headline'),
                        color: slide.textColor,
                        fontSize: `${effectiveHeadlinePt}px`,
                        lineHeight: 1.15,
                        textAlign: slide.headlineAlign || 'center',
                        marginLeft: slide.headlineAlign === 'left' ? '0' : 'auto',
                        marginRight: slide.headlineAlign === 'right' ? '0' : 'auto',
                        textShadow:
                          slide.textAnimation === 'neonFlicker'
                            ? `0 0 16px ${slide.accentColor}, 0 0 32px ${slide.accentColor}`
                            : 'none',
                      }}
                    >
                      {slide.headline || 'キャッチコピーを入力'}
                    </h1>
                    {selectedTextTarget === 'headline' && (
                      <div className="inline-flex items-center gap-1 text-[11px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                        <Type className="w-3 h-3" /> 見出しの書体を変更中
                      </div>
                    )}
                  </div>

                  {/* サブコピー */}
                  {slide.subheadline && (
                    <div
                      onClick={() => onSelectTextTarget?.('subheadline')}
                      className={`p-1 mt-0.5 ${getSelectableClass('subheadline')}`}
                      title="クリックして説明文の書体を変更"
                    >
                      <p
                        className="font-medium opacity-85 max-w-[480px] whitespace-pre-line break-words"
                        style={{ 
                          fontFamily: getTargetFont('subheadline'),
                          fontSize: `${effectiveSubheadlinePt}px`,
                          lineHeight: 1.25,
                          textAlign: slide.subheadlineAlign || 'center',
                          marginLeft: slide.subheadlineAlign === 'left' ? '0' : 'auto',
                          marginRight: slide.subheadlineAlign === 'right' ? '0' : 'auto',
                        }}
                      >
                        {slide.subheadline}
                      </p>
                    </div>
                  )}

                  {/* サブコピー下の画像 (1個) - 形そのまま全体が映るように（object-contain） */}
                  {(() => {
                    const hBannerImg = slide.subheadlineImageUrl || (slide.subheadlineImages && slide.subheadlineImages[0]);
                    if (!hBannerImg) return null;
                    return (
                      <div className="flex items-center justify-center mt-2 mb-1 shrink-0">
                        <div className="w-full max-w-[340px] h-[130px] rounded-2xl bg-transparent overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            src={hBannerImg}
                            alt="参考画像"
                            referrerPolicy="no-referrer"
                            onError={handleImageError}
                            className="w-auto h-auto max-w-full max-h-full object-contain rounded-xl drop-shadow-sm"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>

              {/* メニュー商品リスト（横書き時：空いているスペースいっぱいに均等配置、1個は大、2個はやや大） */}
              {visibleCount > 0 && (
                <div
                  onClick={() => onSelectTextTarget?.('menu')}
                  className={`py-0.5 px-0.5 rounded-2xl flex-1 flex flex-col ${
                    visibleCount === 2 ? 'justify-between gap-4' : 'justify-between gap-2'
                  } min-h-0`}
                  style={{ fontFamily: getTargetFont('menu') }}
                  title="クリックしてメニュー商品の書体を変更"
                >
                  {visibleItems.map((item, idx) => {
                    const itemEffectiveNamePt = item.namePt || slide.menuItemNamePt || autoItemNamePt;
                    const itemEffectiveDescPt = item.descPt || slide.menuItemDescPt || autoItemDescPt;
                    const itemEffectivePricePt = item.pricePt || slide.menuItemPricePt || autoItemPricePt;

                    return (
                      <motion.div
                        key={item.id || idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 + idx * 0.03, duration: 0.15 }}
                        className={`relative rounded-xl border backdrop-blur-sm transition-all flex items-center justify-between shadow-sm flex-1 min-h-0 ${
                          visibleCount === 1
                            ? 'py-4 px-5 gap-4 max-h-[320px]'
                            : visibleCount === 2
                            ? 'py-3 px-4 gap-4'
                            : isDenseMenu
                            ? 'py-1.5 px-2.5 gap-2'
                            : isMediumMenu
                            ? 'py-2 px-2.5 gap-2.5'
                            : 'py-2.5 px-3 gap-3'
                        } ${item.featured ? 'scale-[1.01] ring-2' : ''}`}
                        style={{
                          backgroundColor: `${slide.textColor}10`,
                          borderColor: `${slide.textColor}25`,
                          boxShadow: item.featured ? `0 0 0 2px ${slide.accentColor}` : undefined,
                        }}
                      >
                        {item.imageUrl && (
                          <div
                            className={`rounded-xl bg-transparent flex items-center justify-center overflow-hidden shrink-0 self-center ${
                              visibleCount === 1
                                ? 'w-24 h-24'
                                : visibleCount === 2
                                ? 'w-16 h-16 sm:w-20 sm:h-20'
                                : isDenseMenu
                                ? 'w-12 h-12'
                                : isMediumMenu
                                ? 'w-14 h-14'
                                : 'w-16 h-16'
                            }`}
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              onError={handleImageError}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center self-center">
                          <div className="flex flex-col items-start gap-0.5">
                            <span
                              className="font-bold break-words leading-tight"
                              style={{
                                fontSize: `${itemEffectiveNamePt}px`,
                              }}
                            >
                              {item.name}
                            </span>
                          </div>
                          {item.description && (
                            <p
                              className={`opacity-80 break-words leading-tight whitespace-pre-line mt-0.5 line-clamp-2`}
                              style={{
                                fontSize: `${itemEffectiveDescPt}px`,
                              }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* 右端エリア（タグと価格）：上下完全中央配置 */}
                        <div className="flex items-center gap-2 shrink-0 self-center">
                          {item.tag && (
                            <span
                              className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded text-white shadow-xs shrink-0 whitespace-nowrap tracking-wider flex items-center justify-center leading-none self-center"
                              style={{ backgroundColor: item.tagColor || slide.accentColor }}
                            >
                              {item.tag}
                            </span>
                          )}
                          {item.price && item.price.trim().length > 0 ? (
                            <div
                              className={`shrink-0 flex items-center justify-center px-2 py-0.5 rounded-lg self-center ${
                                item.priceBgColor && item.priceBgColor !== 'transparent'
                                  ? 'border border-slate-300/40 shadow-xs'
                                  : 'border border-transparent'
                              }`}
                              style={{
                                backgroundColor:
                                  item.priceBgColor && item.priceBgColor !== 'transparent'
                                    ? item.priceBgColor
                                    : 'transparent',
                              }}
                            >
                              <span
                                className="font-black tracking-tight whitespace-nowrap leading-none flex items-center justify-center -translate-y-[0.5px]"
                                style={{
                                  fontSize: `${itemEffectivePricePt}px`,
                                  color: slide.accentColor,
                                }}
                              >
                                {item.price}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* フッター部：QRコード & 備考 */}
          <div
            className="shrink-0 mt-auto pt-2.5 pb-1 border-t flex items-center justify-between gap-3 text-xs"
            style={{ borderColor: `${slide.textColor}25` }}
          >
            {/* フッター備考 */}
            <div
              onClick={() => onSelectTextTarget?.('footer')}
              className={`flex-1 p-1 min-w-0 ${getSelectableClass('footer')}`}
              style={{ fontFamily: getTargetFont('footer') }}
              title="クリックしてフッター備考の書体を変更"
            >
              <p className="opacity-80 text-[13px] leading-snug whitespace-pre-line break-words">
                {slide.footerNote || '営業中 / お気軽にお立ち寄りください'}
              </p>
              {selectedTextTarget === 'footer' && (
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded inline-block mt-0.5">
                  フッター書体変更中
                </span>
              )}
            </div>

            {/* QRコードカード（ユーザー指示：QRコード下の文字も改行可能に） */}
            {slide.showQrCode && (
              <div className="flex items-center gap-2 shrink-0 bg-white text-slate-950 p-2 rounded-2xl shadow-lg border border-slate-300 z-10 max-w-[150px]">
                {!qrImgError ? (
                  <img
                    src={qrImageSrc}
                    alt="QRコード"
                    referrerPolicy="no-referrer"
                    onError={() => setQrImgError(true)}
                    className="w-[48px] h-[48px] object-contain rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-[48px] h-[48px] bg-slate-100 flex items-center justify-center rounded-lg shrink-0">
                    <QrCode className="w-6 h-6 text-slate-800" />
                  </div>
                )}
                <div className="text-[11px] font-bold leading-tight min-w-0 flex-1 text-slate-900 break-words whitespace-pre-line">
                  {slide.qrCodeLabel || '読み取り'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
