import React, { useState, useEffect, useRef } from 'react';
import { StepKey, SignageFolder, AppError, SignageSlide } from './types';
import { StepNavigation } from './components/StepNavigation';
import { Step1Signboard } from './components/Step1Signboard';
import { Step2Background } from './components/Step2Background';
import { Step3Content } from './components/Step3Content';
import { Step4Typography } from './components/Step4Typography';
import { Step5ShopName } from './components/Step5ShopName';
import { Step6Copy } from './components/Step6Copy';
import { Step7Items } from './components/Step7Items';
import { Step5Delivery } from './components/Step5Delivery';
import { PreviewPanel } from './components/PreviewPanel';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { FolderManagerView } from './components/FolderManagerView';
import { ErrorAlertModal } from './components/ErrorAlertModal';
import { useOrientation } from './hooks/useOrientation';
import { useSignageFolders } from './hooks/useSignageFolders';
import { useSignageEditor } from './hooks/useSignageEditor';
import { 
  Radio, 
  SlidersHorizontal, 
  Eye, 
  CheckCircle2,
  Smartphone,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Copy
} from 'lucide-react';

export default function App() {
  // グローバルエラー管理（原因と解決方法を明示）
  const [globalError, setGlobalError] = useState<AppError | null>(null);
  const [saveToastMessage, setSaveToastMessage] = useState<string | null>(null);

  // 画面の向き＆デバイス判定フック
  const { isLandscape, isMobileLandscape, windowWidth } = useOrientation();

  // 画面モード：フォルダ選択画面 または 看板エディタ画面
  const [currentView, setCurrentView] = useState<'folder_select' | 'editor'>('folder_select');
  const [currentStep, setCurrentStep] = useState<StepKey>('step2_signboard');

  // 全画面サイネージプレイヤー状態
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fullscreenSlides, setFullscreenSlides] = useState<SignageSlide[]>([]);

  // スマホ縦画面時専用の切り替えタブ（'edit' | 'preview'）
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  // フォルダ管理カスタムフック
  const {
    folders,
    activeFolderId,
    activeFolder,
    setActiveFolderId,
    createFolder,
    deleteFolder,
    duplicateFolder,
    renameFolder,
    saveFolderSlides,
  } = useSignageFolders(setGlobalError);

  // 看板スライド編集カスタムフック
  const {
    slides,
    currentSlide,
    currentSlideIndex,
    setCurrentSlideIndex,
    isPlaying,
    setIsPlaying,
    replayKey,
    replayAnimation,
    updateCurrentSlide,
    applyTemplate,
    addSlide,
    deleteSlide,
    duplicateSlide,
    selectedTextTarget,
    setSelectedTextTarget,
    applyQuickFont,
    loadSlides,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useSignageEditor(setGlobalError);

  // 初回マウント時：選択中フォルダのスライドをエディタに同期ロード
  useEffect(() => {
    if (activeFolder && activeFolder.slides.length > 0) {
      loadSlides(activeFolder.slides);
    }
  }, []);

  // 1つ変えたら自動保存（Auto-save）
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isInitialMount = useRef(true);
  const lastSavedJsonRef = useRef<string>('');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentJson = JSON.stringify(slides);

    // 初回マウント時はスライドの初期JSONを記録して自動保存をスキップ
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSavedJsonRef.current = currentJson;
      return;
    }

    // 内容が変わっていなければ自動保存しない
    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    if (currentView === 'editor' && activeFolderId) {
      setIsSaving(true);
      setIsSaved(false);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

      const timer = setTimeout(() => {
        saveFolderSlides(activeFolderId, slides);
        lastSavedJsonRef.current = currentJson;
        setIsSaving(false);
        setIsSaved(true);

        savedTimerRef.current = setTimeout(() => {
          setIsSaved(false);
        }, 1200);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [slides, activeFolderId, currentView, saveFolderSlides]);

  // フォルダ一覧へ戻る（現在の看板スライドをフォルダへ保存して同期）
  const handleBackToFolders = () => {
    if (activeFolderId) {
      saveFolderSlides(activeFolderId, slides);
    }
    setCurrentView('folder_select');
  };

  // 保存ハンドラ（手動上書き保存）
  const handleSaveOverwrite = () => {
    const success = saveFolderSlides(activeFolderId, slides);
    if (success) {
      lastSavedJsonRef.current = JSON.stringify(slides);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1200);
    }
  };

  // 新規フォルダ作成
  const handleCreateFolder = (name: string, templateSlide?: Partial<SignageSlide>) => {
    const result = createFolder(name, templateSlide);
    if (result) {
      lastSavedJsonRef.current = JSON.stringify([result.initialSlide]);
      setIsSaving(false);
      setIsSaved(false);
      loadSlides([result.initialSlide]);
      setCurrentSlideIndex(0);
      setCurrentStep('step2_signboard');
      setCurrentView('editor');
    }
  };

  // フォルダを開いて編集
  const handleOpenFolder = (folder: SignageFolder) => {
    lastSavedJsonRef.current = JSON.stringify(folder.slides);
    setIsSaving(false);
    setIsSaved(false);
    setActiveFolderId(folder.id);
    loadSlides(folder.slides);
    setCurrentSlideIndex(0);
    setCurrentStep('step2_signboard');
    setCurrentView('editor');
  };

  // フォルダ一覧から直接フルスクリーン再生（最初の看板からスタート）
  const handlePlayFullscreenFolder = (folder: SignageFolder) => {
    setFullscreenSlides(folder.slides);
    setCurrentSlideIndex(0);
    setIsFullscreen(true);
  };

  // エディタからフルスクリーン再生
  const handleOpenEditorFullscreen = () => {
    setFullscreenSlides(slides);
    setCurrentSlideIndex(0);
    setIsFullscreen(true);
  };

  // スマホを横にしても横画面にならないように横画面機能を削除（常時通常のレスポンシブ幅判定のみ）
  const isWideLayout = windowWidth >= 1024;
  const showSidebarPreview = isWideLayout || mobileTab === 'preview';
  const showEditPanel = isWideLayout || mobileTab === 'edit';

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#f4f5f8] text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      {/* 最上部ステップナビゲーション（①〜⑥） */}
      <StepNavigation
        currentStep={currentView === 'folder_select' ? 'step1_folders' : currentStep}
        foldersCount={folders.length}
        onSelectStep={(step) => {
          if (step === 'step1_folders') {
            handleBackToFolders();
          } else {
            if (!activeFolderId && folders.length > 0) {
              handleOpenFolder(folders[0]);
            }
            setCurrentView('editor');
            setCurrentStep(step);
          }
          setMobileTab('edit');
        }}
        onOpenFullscreen={handleOpenEditorFullscreen}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onSaveOverwrite={handleSaveOverwrite}
        isSaveDisabled={!activeFolderId && folders.length === 0}
        isPlayDisabled={slides.length === 0}
        isFullscreenDisabled={slides.length === 0}
        isMobileLandscape={isMobileLandscape}
        isSaving={isSaving}
        isSaved={isSaved}
      />

      {/* 画面1：看板フォルダ管理 (0/10) 初期画面 */}
      {currentView === 'folder_select' && (
        <div className="flex-1 overflow-y-auto w-full">
          <FolderManagerView
            folders={folders}
            onOpenFolder={handleOpenFolder}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={deleteFolder}
            onDuplicateFolder={duplicateFolder}
            onRenameFolder={renameFolder}
            onPlayFullscreenFolder={handlePlayFullscreenFolder}
          />
        </div>
      )}

      {/* 画面2：看板エディタ（ステップ＆リアルタイムプレビュー） */}
      {currentView === 'editor' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* 
            スマホ縦画面時のみ表示される案内・切り替えバー
            横画面・大画面時は自動で2カラムになりプレビューが常時右側に表示されるため非表示
          */}
          {/* 
            タブバー＆Undo/Redoバー
            スマホ時は「設定パネル/看板プレビュー」タブ、右側に元に戻す/やり直す
            PC大画面時は左側にステータス、右側に元に戻す/やり直す
          */}
          <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between shrink-0 z-30 shadow-md">
            {!isWideLayout ? (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setMobileTab('edit')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    mobileTab === 'edit'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>設定パネル</span>
                </button>
                <button
                  onClick={() => setMobileTab('preview')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    mobileTab === 'preview'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>看板プレビュー</span>
                </button>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>看板編集 ＆ リアルタイムプレビュー</span>
              </div>
            )}

            {/* 右側の空いているスペース：元に戻す(Undo) / やり直す(Redo) */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="元に戻す (Undo)"
                className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">戻す</span>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="やり直す (Redo)"
                className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">進む</span>
              </button>
            </div>
          </div>

          {/* 
            【常に表示＆固定位置】看板スライド選択・管理バー
            設定パネル・看板プレビュー・redo/undoの下に固定配置し、上下スクロールさせない
          */}
          <div className="bg-slate-950 border-b border-slate-800/80 px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2.5 shrink-0 z-20 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {slides.map((s, idx) => {
                  const isSelected = currentSlideIndex === idx;
                  return (
                    <div
                      key={s.id || idx}
                      onClick={() => {
                        setCurrentSlideIndex(idx);
                        replayAnimation();
                      }}
                      className={`px-3 py-1 rounded-xl border flex items-center gap-2 shrink-0 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-black whitespace-nowrap">
                        {idx + 1}枚目 ({s.duration}秒)
                      </span>

                      {isSelected && (
                        <div className="flex items-center gap-1 ml-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => duplicateSlide(idx)}
                            disabled={slides.length >= 10}
                            title="この看板を複製"
                            className="p-0.5 text-slate-950 hover:opacity-75 disabled:opacity-30 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {slides.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteSlide(idx)}
                              title="この看板を削除"
                              className="p-0.5 text-slate-950 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 看板を追加ボタン */}
            <button
              type="button"
              onClick={addSlide}
              disabled={slides.length >= 10}
              className={`px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                slides.length >= 10
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer shadow-sm hover:shadow'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">看板を追加 {slides.length >= 10 ? '(上限10枚)' : ''}</span>
            </button>
          </div>

          {/* 
            メインワークスペースレイアウト：
            - 横画面・大画面（PC・タブレット・横画面スマホ）：
              画面全体（100dvh）に完全収容し、左側は独立スクロール操作パネル、
              右側は9:16見切れゼロの看板プレビューを常時画面内に収めて表示！
            - 狭いスマホ縦画面：
              タブに応じて設定またはプレビューを画面いっぱいに表示
          */}
          <main className={`flex-1 w-full mx-auto min-h-0 overflow-hidden ${
            isWideLayout 
              ? `${isMobileLandscape ? 'p-1 sm:p-1.5' : 'p-2 sm:p-3'} grid grid-cols-12 gap-1.5 sm:gap-3 h-full` 
              : 'p-2 sm:p-3 flex flex-col h-full'
          }`}>
            {/* 左側：各ステップの操作パネル */}
            <div
              className={`bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm ${
                isWideLayout
                  ? 'col-span-7 h-full min-h-0 overflow-y-auto p-2.5 sm:p-4 scrollbar-thin'
                  : `flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 ${showEditPanel ? 'block' : 'hidden'}`
              }`}
            >
              {currentStep === 'step2_signboard' && (
                <Step1Signboard
                  slides={slides}
                  currentSlideIndex={currentSlideIndex}
                  onSelectSlideIndex={(idx) => {
                    setCurrentSlideIndex(idx);
                    replayAnimation();
                  }}
                  onAddSlide={addSlide}
                  onDeleteSlide={deleteSlide}
                  onDuplicateSlide={duplicateSlide}
                  onUpdateSlide={updateCurrentSlide}
                  onApplyTemplate={applyTemplate}
                  folders={folders}
                  activeFolderName={activeFolder?.name}
                  onBackToFolders={handleBackToFolders}
                  onNext={() => setCurrentStep('step3_background')}
                />
              )}

              {currentStep === 'step3_background' && (
                <Step2Background
                  slide={currentSlide}
                  onChange={updateCurrentSlide}
                  onPrev={() => setCurrentStep('step2_signboard')}
                  onNext={() => setCurrentStep('step4_content')}
                />
              )}

              {currentStep === 'step4_content' && (
                <Step3Content
                  slide={currentSlide}
                  onChange={updateCurrentSlide}
                  onPrev={() => setCurrentStep('step3_background')}
                  onNext={() => setCurrentStep('step5_shopname')}
                  selectedTextTarget={selectedTextTarget}
                  onSelectTextTarget={setSelectedTextTarget}
                  onApplyQuickFont={applyQuickFont}
                />
              )}

              {currentStep === 'step5_shopname' && (
                <Step5ShopName
                  slide={currentSlide}
                  onChange={updateCurrentSlide}
                  onPrev={() => setCurrentStep('step4_content')}
                  onNext={() => setCurrentStep('step6_copy')}
                />
              )}

              {currentStep === 'step6_copy' && (
                <Step6Copy
                  slide={currentSlide}
                  onChange={updateCurrentSlide}
                  onPrev={() => setCurrentStep('step5_shopname')}
                  onNext={() => setCurrentStep('step7_items')}
                />
              )}

              {currentStep === 'step7_items' && (
                <Step7Items
                  slide={currentSlide}
                  onChange={updateCurrentSlide}
                  onPrev={() => setCurrentStep('step6_copy')}
                  onNext={() => setCurrentStep('step8_typography')}
                />
              )}

              {currentStep === 'step8_typography' && (
                <Step4Typography
                  slide={currentSlide}
                  onChange={updateCurrentSlide}
                  onPrev={() => setCurrentStep('step7_items')}
                  onNext={() => setCurrentStep('step9_delivery')}
                  onReplayAnimation={replayAnimation}
                />
              )}

              {currentStep === 'step9_delivery' && (
                <Step5Delivery
                  slides={slides}
                  currentSlideIndex={currentSlideIndex}
                  onSelectSlideIndex={(idx) => {
                    setCurrentSlideIndex(idx);
                    replayAnimation();
                  }}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onOpenFullscreen={handleOpenEditorFullscreen}
                  onPrev={() => setCurrentStep('step8_typography')}
                />
              )}
            </div>

            {/* 
              右側：看板ライブプレビュー（9:16見切れゼロ・常時表示）
              スマホ横画面およびPCでは col-span-5 かつ h-full で常に画面内に収まる
            */}
            {activeFolderId ? (
              <div
                className={`flex flex-col items-center min-h-0 ${
                  isWideLayout
                    ? 'col-span-5 h-full overflow-hidden'
                    : `flex-1 min-h-0 w-full overflow-hidden ${showSidebarPreview ? 'flex' : 'hidden'}`
                }`}
              >
                <PreviewPanel
                  currentSlide={currentSlide}
                  slidesCount={slides.length}
                  currentSlideIndex={currentSlideIndex}
                  onSelectSlideIndex={setCurrentSlideIndex}
                  replayKey={replayKey}
                  onReplayAnimation={replayAnimation}
                  selectedTextTarget={selectedTextTarget}
                  onSelectTextTarget={setSelectedTextTarget}
                  onApplyQuickFont={applyQuickFont}
                  isMobileLandscape={isMobileLandscape}
                />
              </div>
            ) : (
              <div className={`${isWideLayout ? 'col-span-5' : 'flex-1'} flex items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800 p-8 text-slate-500 italic`}>
                看板フォルダを選択して編集を開始してください
              </div>
            )}
          </main>
        </div>
      )}

      {/* フルスクリーンサイネージプレイヤーモーダル（常に最初の看板からスタート） */}
      {isFullscreen && (
        <FullscreenPlayer
          slides={fullscreenSlides.length > 0 ? fullscreenSlides : slides}
          initialIndex={0}
          onClose={() => setIsFullscreen(false)}
        />
      )}

      {/* 上書き保存完了トースト通知 */}
      {saveToastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 font-bold text-xs animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{saveToastMessage}</span>
        </div>
      )}

      {/* グローバルエラー通知モーダル（理由と解決方法を明示） */}
      <ErrorAlertModal
        error={globalError}
        onClose={() => setGlobalError(null)}
      />
    </div>
  );
}
