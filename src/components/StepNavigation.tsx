import React, { useState } from 'react';
import { StepKey } from '../types';
import { Maximize2, Play, Pause, Save, Check, Loader2 } from 'lucide-react';

interface StepNavigationProps {
  currentStep: StepKey;
  onSelectStep: (step: StepKey) => void;
  onOpenFullscreen: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSaveOverwrite?: () => void;
  isSaveDisabled?: boolean;
  isPlayDisabled?: boolean;
  isFullscreenDisabled?: boolean;
  foldersCount?: number;
  isMobileLandscape?: boolean;
  isSaving?: boolean;
  isSaved?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onSelectStep,
  onOpenFullscreen,
  isPlaying,
  onTogglePlay,
  onSaveOverwrite,
  isSaveDisabled = false,
  isPlayDisabled = false,
  isFullscreenDisabled = false,
  foldersCount = 0,
  isMobileLandscape = false,
  isSaving = false,
  isSaved = false,
}) => {
  const [justSaved, setJustSaved] = useState(false);

  const handleSaveClick = () => {
    if (onSaveOverwrite) {
      onSaveOverwrite();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const steps: { key: StepKey; num: string; title: string; shortTitle: string }[] = [
    { key: 'step1_folders', num: '1', title: `フォルダ (${foldersCount}/20)`, shortTitle: `フォルダ(${foldersCount})` },
    { key: 'step2_signboard', num: '2', title: 'デザイン', shortTitle: 'デザイン' },
    { key: 'step3_background', num: '3', title: '背景', shortTitle: '背景' },
    { key: 'step4_content', num: '4', title: '書体', shortTitle: '書体' },
    { key: 'step5_shopname', num: '5', title: '店舗名・ブランド名', shortTitle: '店舗・ブランド' },
    { key: 'step6_copy', num: '6', title: 'コピー', shortTitle: 'コピー' },
    { key: 'step7_items', num: '7', title: '商品', shortTitle: '商品' },
    { key: 'step8_typography', num: '8', title: '文字の動き', shortTitle: '動き' },
    { key: 'step9_delivery', num: '9', title: '配信', shortTitle: '配信' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-2 sm:px-3 py-1.5 sm:py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* 
          中央：1〜6番ステップナビゲーション
          【見切れ完全防止策】
          1. justify-center による左端見切れバグを排除（mx-auto + w-max + justify-start md:justify-center）
          2. レスポンシブ適応型（Adaptive）：
             - 狭い画面/横画面では「選択中ステップのみテキスト展開、他は丸数字アイコン」で幅を極小化（一切見切れなし！）
             - 中画面以上では全ステップのテキストを表示
        */}
        <nav className="flex items-center flex-wrap justify-center py-1 flex-1 min-w-0 px-2">
          <div className="flex items-center flex-wrap justify-center gap-1.5 w-full">
            {steps.map((s) => {
              const isActive = currentStep === s.key;
              const isDisabled = s.key !== 'step1_folders' && isSaveDisabled;

              return (
                <button
                  key={s.key}
                  onClick={() => !isDisabled && onSelectStep(s.key)}
                  disabled={isDisabled}
                  title={s.title}
                  className={`flex items-center gap-1 rounded-full font-black transition-all shrink-0 cursor-pointer whitespace-nowrap px-2 py-0.5 sm:px-2.5 sm:py-1 ${
                    isActive
                      ? 'bg-white text-slate-950 ring-2 ring-amber-500 border border-amber-500 shadow-md shadow-amber-500/25'
                      : 'bg-white/90 hover:bg-white text-slate-900 border border-slate-300 shadow-xs hover:border-slate-400'
                  } ${
                    isDisabled ? 'bg-slate-800/80 text-slate-500 border-slate-700/60 cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  {/* 数字アイコンバッジ */}
                  <span
                    className={`rounded-full flex items-center justify-center font-black shrink-0 transition-transform ${
                      isActive
                        ? 'w-4 h-4 text-[10px] bg-amber-500 text-slate-950 ring-1 ring-white'
                        : 'w-4 h-4 text-[10px] bg-slate-900 text-amber-400 border border-amber-500/60'
                    } ${isDisabled ? 'bg-slate-700 text-slate-500 border-transparent' : ''}`}
                  >
                    {s.num}
                  </span>

                  <span className="tracking-tight font-bold text-[10px] sm:text-[11px]">
                    {s.shortTitle || s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* 右側：自動保存（上）と配信（下）の上下2行配置 */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 自動再生テスト（大画面時のみ表示） */}
          <button
            onClick={onTogglePlay}
            disabled={isPlayDisabled}
            className={`hidden lg:flex items-center gap-1 rounded-full font-bold border transition-all cursor-pointer px-2.5 py-1 text-xs ${
              isPlayDisabled
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
            title="自動ループテスト再生"
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isPlaying ? '再生中' : '再生'}</span>
          </button>

          {/* 上下２行：上が自動保存、下が配信 */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {/* 上：自動保存ボタン */}
            <button
              onClick={handleSaveClick}
              disabled={isSaveDisabled}
              className={`w-[78px] sm:w-[88px] justify-center rounded-full font-black flex items-center gap-1 transition-colors duration-150 cursor-pointer shadow-md active:scale-95 py-0.5 sm:py-1 text-[10.5px] sm:text-[11px] shrink-0 select-none ${
                isSaveDisabled
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : isSaving
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  : isSaved || justSaved
                  ? 'bg-emerald-600 text-white border border-emerald-400 shadow-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-blue-500/30'
              }`}
              title="編集内容をこの看板フォルダに上書き保存"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-300 shrink-0" />
                  <span>保存中</span>
                </>
              ) : isSaved || justSaved ? (
                <>
                  <Check className="w-3 h-3 stroke-[3] text-emerald-300 shrink-0" />
                  <span>保存済</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>自動保存</span>
                </>
              )}
            </button>

            {/* 下：配信ボタン */}
            <button
              onClick={onOpenFullscreen}
              disabled={isFullscreenDisabled}
              className={`w-[78px] sm:w-[88px] justify-center font-black rounded-full flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95 py-0.5 sm:py-1 text-[10.5px] sm:text-[11px] select-none ${
                isFullscreenDisabled
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              }`}
              title="店頭モニターやテレビで全画面サイネージ配信を開始"
            >
              <Maximize2 className="w-3 h-3 text-slate-950" />
              <span>配信</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
