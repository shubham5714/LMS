import React, { Fragment, useRef } from "react";
import SunEditor from 'suneditor-react';
import SunEditorCore from "suneditor/src/lib/core";
import "suneditor/dist/css/suneditor.min.css";

interface SunEditorOptions {
  buttonList?: string[][];
  defaultTag?: string;
  minHeight?: string;
  showPathLabel?: boolean;
  font?: string[];
  defaultStyle?: string;
}

interface SunEditorProps {
  width?: string | number;
  height?: string | number;
  placeholder?: string;
  autofocus?: boolean;
  setplugin?: boolean;
  setcontent?: string;
  appendcontent?: string;
  defaultstyle?: string;
  disable?: boolean;
  hide?: boolean;
  hidetoolbar?: boolean;
  disabletoolbar?: boolean;
  onLoad?: string;
  defaulContent?: string;
  onScroll?: (event: UIEvent) => void;
  onClick?: (event: MouseEvent) => void;
  onCopy?: (event: ClipboardEvent, clipboardData: DataTransfer | null) => boolean;
  onCut?: (event: ClipboardEvent, clipboardData: DataTransfer | null) => boolean;
  setoptions?: SunEditorOptions;
  onChange?: (content: string) => void;
  onEditorReady?: (editor: SunEditorCore) => void;
}

const SpkSunEditor: React.FC<SunEditorProps> = ({
  width,
  height,
  placeholder,
  autofocus,
  setplugin,
  setcontent,
  appendcontent,
  defaultstyle,
  disable,
  hide,
  hidetoolbar,
  disabletoolbar,
  defaulContent,
  setoptions,
  onChange,
  onEditorReady
}) => {
  const editor = useRef<SunEditorCore | null>(null);

  const getSunEditorInstance = (sunEditor: SunEditorCore) => {
    editor.current = sunEditor;
    onEditorReady?.(sunEditor);
  };

  const handleChange = (content: string): void => {
    onChange?.(content);
  };

  const handleScroll = (_event: UIEvent): void => { };

  const handleClick = (_event: MouseEvent): void => { };

  const handleMouseDown = (_event: MouseEvent): void => { };

  const handleInput = (_event: InputEvent): void => { };

  const handleKeyUp = (_event: KeyboardEvent): void => { };

  const handleFocus = (_event: FocusEvent): void => { };

  const handleBlur = (_event: FocusEvent, _editorContents: string): void => { };

  const handleKeyDown = (_event: KeyboardEvent): void => { };

  const handleDrop = (_event: DragEvent): void => { };

  const handleImageUploadBefore = (_data: File | Blob): boolean => {
    return true;
  };

  const handleImageUpload = (_data: File | Blob): void => { };

  const handleImageUploadError = (_data: string): void => { };

  const handleVideoUploadBefore = (_data: File | Blob): boolean => {
    return true;
  };

  const handleVideoUpload = (_data: File | Blob): void => { };

  const handleVideoUploadError = (_data: string): void => { };

  const handleAudioUploadBefore = (_data: File | Blob): boolean => {
    return true;
  };

  const handleAudioUpload = (_data: File | Blob): void => { };

  const handleAudioUploadError = (_data: string): void => { };

  const handleResizeEditor = (_data: { width: string; height: string }): void => { };

  const handleCopy = (_event: ClipboardEvent, _clipboardData: DataTransfer | null): boolean => {
    return true;
  };

  const handleCut = (_event: ClipboardEvent, _clipboardData: DataTransfer | null): boolean => {
    return true;
  };

  const handlePaste = (_data: ClipboardEvent): void => { };

  const imageUploadHandler = (_xmlHttpRequest: XMLHttpRequest, _info: {
    isUpdate: boolean;
    linkValue: string;
    element: Element;
    align: string;
    linkNewWindow: boolean;
  }): void => { };

  const toggleCodeView = (_isCodeView: boolean): void => { };

  const toggleFullScreen = (_isFullScreen: boolean): void => { };

  const showInline = (_toolbar: Element, _context: string): void => { };

  const showController = (_name: string, _controllers: string[]): void => { };

  const editorOptions: SunEditorOptions = {
    ...setoptions
  };

  return (
    <Fragment>
      <SunEditor
        setOptions={editorOptions}
        getSunEditorInstance={getSunEditorInstance}
        width={width}
        height={height}
        placeholder={placeholder}
        autoFocus={autofocus}
        setAllPlugins={setplugin}
        setContents={setcontent}
        appendContents={appendcontent}
        setDefaultStyle={defaultstyle}
        disable={disable}
        hide={hide}
        hideToolbar={hidetoolbar}
        disableToolbar={disabletoolbar}
        defaultValue={defaulContent}
        onChange={handleChange}
        onScroll={handleScroll}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onImageUploadBefore={handleImageUploadBefore}
        onImageUpload={handleImageUpload}
        onImageUploadError={handleImageUploadError}
        onVideoUploadBefore={handleVideoUploadBefore}
        onVideoUpload={handleVideoUpload}
        onVideoUploadError={handleVideoUploadError}
        onAudioUploadBefore={handleAudioUploadBefore}
        onAudioUpload={handleAudioUpload}
        onAudioUploadError={handleAudioUploadError}
        onResizeEditor={handleResizeEditor}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        imageUploadHandler={imageUploadHandler}
        toggleCodeView={toggleCodeView}
        toggleFullScreen={toggleFullScreen}
        showInline={showInline}
        showController={showController}
      />
    </Fragment>
  );
};

export default SpkSunEditor;
