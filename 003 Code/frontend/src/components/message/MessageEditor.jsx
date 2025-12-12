import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { 
  Bold, 
  Underline, 
  Strikethrough,
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link, 
  Image, 
  Table,
  Maximize,
  Minimize,
  HelpCircle,
  MoreVertical,
  X
} from 'lucide-react';

const EditorGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
  border-bottom: none;
  flex-wrap: wrap;
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  &:active,
  &.active {
    background-color: #e5e7eb;
    color: #2563eb;
    border: 1px solid #d1d5db;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

const ToolbarDropdown = styled.select`
  height: 32px;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: #ffffff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const TableModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 24px;
  z-index: 10000;
  min-width: 300px;
`;

const TableModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const TableModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const TableModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TableSizeInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TableSizeLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const TableSizeInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TableSizeInputField = styled.input`
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TableModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.primary ? '#2563eb' : '#e5e7eb'};
  background-color: ${props => props.primary ? '#2563eb' : '#ffffff'};
  color: ${props => props.primary ? '#ffffff' : '#374151'};
  
  &:hover {
    background-color: ${props => props.primary ? '#1d4ed8' : '#f9fafb'};
    border-color: ${props => props.primary ? '#1d4ed8' : '#d1d5db'};
  }
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  margin: 0 4px;
`;

const EditorContainer = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0 0 8px 8px;
  background-color: #ffffff;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #374151;
  background-color: #ffffff;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ContentTextarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 12px 16px;
  border: none;
  font-size: ${props => props.fontSize || '14'}px;
  color: #374151;
  background-color: #ffffff;
  resize: vertical;
  font-family: ${props => props.fontFamily || 'inherit'};
  text-align: ${props => props.textAlign || 'left'};
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const FullscreenOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
`;

const FullscreenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const FullscreenTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const FullscreenCloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1a1a1a;
  }
`;

const FullscreenContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const HelpModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 24px;
  z-index: 10000;
  max-width: 500px;
  width: 90%;
`;

const HelpModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const HelpModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const HelpModalContent = styled.div`
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  
  h4 {
    font-size: 16px;
    font-weight: 600;
    margin: 16px 0 8px 0;
    color: #1a1a1a;
  }
  
  ul {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin: 4px 0;
  }
  
  code {
    background-color: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
  }
`;

const CharacterCount = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: ${props => props.exceeded ? '#ef4444' : '#6b7280'};
`;

function MessageEditor({ title, content, onTitleChange, onContentChange }) {
  const maxLength = 90;
  const currentLength = content.length;
  const exceeded = currentLength > maxLength;
  
  const textareaRef = useRef(null);
  const [activeButtons, setActiveButtons] = useState({
    bold: false,
    underline: false,
    strikethrough: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
  });
  
  const [fontFamily, setFontFamily] = useState('맑은 고딕');
  const [fontSize, setFontSize] = useState('14');
  const [textAlign, setTextAlign] = useState('left');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const fileInputRef = useRef(null);

  // 선택 영역 가져오기
  const getSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content.substring(start, end);
    
    return { start, end, text };
  };

  // 선택 영역 설정
  const setSelection = (start, end) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end);
    }, 0);
  };

  // 서식 토글 함수 (통합)
  const toggleFormat = (type) => {
    const { start, end } = getSelection();
    if (start === end) return; // 선택 영역 없음
    
    // 서식 기호 정의
    const formatMap = {
      bold: { before: '**', after: '**', key: 'bold' },
      underline: { before: '__', after: '__', key: 'underline' },
      strikethrough: { before: '~~', after: '~~', key: 'strikethrough' },
    };
    
    const format = formatMap[type];
    if (!format) return;
    
    const selectedText = content.substring(start, end);
    
    // 선택 영역 앞뒤의 전체 컨텍스트 확인
    const beforeText = content.substring(Math.max(0, start - format.before.length), start);
    const afterText = content.substring(end, Math.min(content.length, end + format.after.length));
    
    // 선택된 텍스트 자체가 서식 기호로 시작/끝나는지 확인
    const textStartsWithFormat = selectedText.startsWith(format.before);
    const textEndsWithFormat = selectedText.endsWith(format.after);
    
    // 서식이 이미 적용되어 있는지 확인 (두 가지 경우)
    // 1. 선택 영역 앞뒤에 서식 기호가 있는 경우
    // 2. 선택된 텍스트 자체가 서식 기호로 감싸져 있는 경우
    const hasBeforeFormat = beforeText === format.before;
    const hasAfterFormat = afterText === format.after;
    const isFormattedByContext = hasBeforeFormat && hasAfterFormat;
    const isFormattedByText = textStartsWithFormat && textEndsWithFormat && selectedText.length >= format.before.length + format.after.length;
    const isFormatted = isFormattedByContext || isFormattedByText;
    
    if (isFormatted) {
      // 서식 제거
      let newStart, newEnd, newSelectedText;
      
      if (isFormattedByContext) {
        // 선택 영역 앞뒤의 서식 기호 제거
        newStart = start - format.before.length;
        newEnd = end + format.after.length;
        newSelectedText = selectedText;
      } else {
        // 선택된 텍스트 내부의 서식 기호 제거
        newStart = start;
        newEnd = end;
        newSelectedText = selectedText.slice(format.before.length, -format.after.length);
      }
      
      const newContent = 
        content.substring(0, newStart) + 
        newSelectedText + 
        content.substring(newEnd);
      
      onContentChange(newContent);
      setSelection(newStart, newStart + newSelectedText.length);
      setActiveButtons(prev => ({ ...prev, [format.key]: false }));
    } else {
      // 서식 적용
      const newContent = 
        content.substring(0, start) + 
        format.before + 
        selectedText + 
        format.after + 
        content.substring(end);
      
      onContentChange(newContent);
      setSelection(start, start + format.before.length + selectedText.length + format.after.length);
      setActiveButtons(prev => ({ ...prev, [format.key]: true }));
    }
  };

  // Bold 토글
  const handleBold = () => {
    toggleFormat('bold');
  };

  // Underline 토글
  const handleUnderline = () => {
    toggleFormat('underline');
  };

  // Strikethrough 토글
  const handleStrikethrough = () => {
    toggleFormat('strikethrough');
  };

  // 정렬 변경
  const handleAlign = (align) => {
    setTextAlign(align);
    setActiveButtons(prev => ({
      ...prev,
      alignLeft: align === 'left',
      alignCenter: align === 'center',
      alignRight: align === 'right',
    }));
  };

  // 표 삽입 모달 열기
  const handleInsertTable = () => {
    setShowTableModal(true);
  };

  // 표 삽입 확인
  const handleTableConfirm = () => {
    const { start } = getSelection();
    
    // 헤더 행 생성
    const headerRow = '| ' + Array(tableCols).fill('제목').join(' | ') + ' |\n';
    const separatorRow = '|' + Array(tableCols).fill('------').join('|') + '|\n';
    
    // 데이터 행 생성
    const dataRows = Array(tableRows - 1).fill(0).map(() => 
      '| ' + Array(tableCols).fill('내용').join(' | ') + ' |\n'
    ).join('');
    
    const tableTemplate = '\n' + headerRow + separatorRow + dataRows;
    const newContent = 
      content.substring(0, start) + 
      tableTemplate + 
      content.substring(start);
    onContentChange(newContent);
    setSelection(start + tableTemplate.length, start + tableTemplate.length);
    setShowTableModal(false);
  };

  // 링크 삽입
  const handleInsertLink = () => {
    const { start, end, text } = getSelection();
    if (start === end) {
      alert('링크로 변환할 텍스트를 선택해주세요.');
      return;
    }
    
    const url = prompt('URL을 입력하세요:', 'https://');
    if (!url) return;
    
    const linkText = `[${text}](${url})`;
    const newContent = 
      content.substring(0, start) + 
      linkText + 
      content.substring(end);
    onContentChange(newContent);
    setSelection(start, start + linkText.length);
  };

  // 이미지 삽입 (파일 선택)
  const handleInsertImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 이미지 파일 선택 처리
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    
    const { start } = getSelection();
    const imageUrl = URL.createObjectURL(file);
    const altText = file.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
    const imageText = `![${altText}](${imageUrl})`;
    
    const newContent = 
      content.substring(0, start) + 
      imageText + 
      content.substring(start);
    onContentChange(newContent);
    setSelection(start + imageText.length, start + imageText.length);
    
    // 파일 입력 초기화
    e.target.value = '';
  };

  // 전체화면 토글
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // ESC 키로 전체화면 종료
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);


  // 폰트 변경
  const handleFontFamilyChange = (font) => {
    setFontFamily(font);
  };

  // 글자 크기 변경
  const handleFontSizeChange = (size) => {
    setFontSize(size);
  };

  // 툴바 렌더링 함수
  const renderToolbar = () => (
    <Toolbar>
      <ToolbarButton type="button" title="스타일 메뉴">
        <MoreVertical size={18} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton 
        type="button" 
        title="굵게"
        className={activeButtons.bold ? 'active' : ''}
        onClick={handleBold}
      >
        <Bold size={18} />
      </ToolbarButton>
      <ToolbarButton 
        type="button" 
        title="밑줄"
        className={activeButtons.underline ? 'active' : ''}
        onClick={handleUnderline}
      >
        <Underline size={18} />
      </ToolbarButton>
      <ToolbarButton 
        type="button" 
        title="취소선"
        className={activeButtons.strikethrough ? 'active' : ''}
        onClick={handleStrikethrough}
      >
        <Strikethrough size={18} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarDropdown 
        value={fontFamily}
        onChange={(e) => handleFontFamilyChange(e.target.value)}
      >
        <option value="맑은 고딕">맑은 고딕</option>
        <option value="굴림">굴림</option>
        <option value="돋움">돋움</option>
        <option value="바탕">바탕</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
      </ToolbarDropdown>
      <ToolbarDropdown 
        value={fontSize}
        onChange={(e) => handleFontSizeChange(e.target.value)}
      >
        <option value="10">10</option>
        <option value="12">12</option>
        <option value="14">14</option>
        <option value="16">16</option>
        <option value="18">18</option>
        <option value="20">20</option>
        <option value="24">24</option>
        <option value="28">28</option>
        <option value="32">32</option>
      </ToolbarDropdown>
      <ToolbarDivider />
      <ToolbarButton 
        type="button" 
        title="왼쪽 정렬"
        className={activeButtons.alignLeft ? 'active' : ''}
        onClick={() => handleAlign('left')}
      >
        <AlignLeft size={18} />
      </ToolbarButton>
      <ToolbarButton 
        type="button" 
        title="가운데 정렬"
        className={activeButtons.alignCenter ? 'active' : ''}
        onClick={() => handleAlign('center')}
      >
        <AlignCenter size={18} />
      </ToolbarButton>
      <ToolbarButton 
        type="button" 
        title="오른쪽 정렬"
        className={activeButtons.alignRight ? 'active' : ''}
        onClick={() => handleAlign('right')}
      >
        <AlignRight size={18} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton 
        type="button" 
        title="표 삽입"
        onClick={handleInsertTable}
      >
        <Table size={18} />
      </ToolbarButton>
      <ToolbarButton 
        type="button" 
        title="링크 삽입"
        onClick={handleInsertLink}
      >
        <Link size={18} />
      </ToolbarButton>
      <ToolbarButton 
        type="button" 
        title="이미지 삽입"
        onClick={handleInsertImage}
      >
        <Image size={18} />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton 
        type="button" 
        title="전체화면"
        onClick={handleFullscreen}
      >
        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
      </ToolbarButton>
      <ToolbarButton 
        type="button" 
        title="도움말"
        onClick={() => setShowHelp(true)}
      >
        <HelpCircle size={18} />
      </ToolbarButton>
    </Toolbar>
  );

  if (isFullscreen) {
    return (
      <>
        <FullscreenOverlay>
          <FullscreenHeader>
            <FullscreenTitle>메시지 편집</FullscreenTitle>
            <FullscreenCloseButton onClick={handleFullscreen}>
              <X size={20} />
            </FullscreenCloseButton>
          </FullscreenHeader>
          <FullscreenContent>
            {renderToolbar()}
            <EditorContainer style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '0 0 8px 8px' }}>
              <TitleInput
                type="text"
                placeholder="제목 입력"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
              />
              <ContentTextarea
                ref={textareaRef}
                placeholder="메시지 내용을 입력하세요 (90자 이내)"
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                fontFamily={fontFamily}
                fontSize={fontSize}
                textAlign={textAlign}
                style={{ flex: 1, minHeight: 'auto', resize: 'none' }}
              />
              <CharacterCount exceeded={exceeded}>
                {currentLength} / {maxLength}자
              </CharacterCount>
            </EditorContainer>
          </FullscreenContent>
        </FullscreenOverlay>
        {showHelp && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 10001,
              }}
              onClick={() => setShowHelp(false)}
            />
            <HelpModal style={{ zIndex: 10002 }}>
              <HelpModalHeader>
                <HelpModalTitle>서식 사용법</HelpModalTitle>
                <FullscreenCloseButton onClick={() => setShowHelp(false)}>
                  <X size={20} />
                </FullscreenCloseButton>
              </HelpModalHeader>
              <HelpModalContent>
                <h4>텍스트 서식</h4>
                <ul>
                  <li><strong>굵게:</strong> 텍스트 선택 후 <code>B</code> 버튼 또는 <code>**텍스트**</code></li>
                  <li><strong>밑줄:</strong> 텍스트 선택 후 <code>U</code> 버튼 또는 <code>__텍스트__</code></li>
                  <li><strong>취소선:</strong> 텍스트 선택 후 <code>S</code> 버튼 또는 <code>~~텍스트~~</code></li>
                </ul>
                <h4>링크</h4>
                <ul>
                  <li>텍스트 선택 후 링크 버튼 클릭</li>
                  <li>형식: <code>[텍스트](URL)</code></li>
                </ul>
                <h4>이미지</h4>
                <ul>
                  <li>이미지 버튼 클릭 후 URL 입력</li>
                  <li>형식: <code>![대체텍스트](이미지URL)</code></li>
                </ul>
                <h4>표</h4>
                <ul>
                  <li>표 버튼 클릭 시 기본 표 템플릿 삽입</li>
                  <li>형식: <code>| 제목 | 제목 |</code></li>
                </ul>
                <h4>기타</h4>
                <ul>
                  <li><strong>서식 제거:</strong> 선택한 텍스트의 모든 서식 제거</li>
                  <li><strong>정렬:</strong> 왼쪽/가운데/오른쪽 정렬</li>
                  <li><strong>전체화면:</strong> ESC 키로 종료 가능</li>
                </ul>
              </HelpModalContent>
            </HelpModal>
          </>
        )}
      </>
    );
  }

  return (
    <EditorGroup>
      <Label>제목 / 내용</Label>
      {renderToolbar()}
      <EditorContainer>
        <TitleInput
          type="text"
          placeholder="제목 입력"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <ContentTextarea
          ref={textareaRef}
          placeholder="메시지 내용을 입력하세요 (90자 이내)"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          fontFamily={fontFamily}
          fontSize={fontSize}
          textAlign={textAlign}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageFileChange}
        />
        <CharacterCount exceeded={exceeded}>
          {currentLength} / {maxLength}자
        </CharacterCount>
      </EditorContainer>
      
      {isFullscreen && (
        <FullscreenOverlay>
          <FullscreenHeader>
            <FullscreenTitle>메시지 편집</FullscreenTitle>
            <FullscreenCloseButton onClick={handleFullscreen}>
              <X size={20} />
            </FullscreenCloseButton>
          </FullscreenHeader>
          <FullscreenContent>
            {renderToolbar()}
            <EditorContainer style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
              <ContentTextarea
                ref={textareaRef}
                placeholder="메시지 내용을 입력하세요 (90자 이내)"
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                fontFamily={fontFamily}
                fontSize={fontSize}
                textAlign={textAlign}
                style={{ flex: 1, minHeight: 'auto', resize: 'none' }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFileChange}
              />
              <CharacterCount exceeded={exceeded}>
                {currentLength} / {maxLength}자
              </CharacterCount>
            </EditorContainer>
          </FullscreenContent>
        </FullscreenOverlay>
      )}
      
      {showHelp && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
            }}
            onClick={() => setShowHelp(false)}
          />
          <HelpModal>
            <HelpModalHeader>
              <HelpModalTitle>서식 사용법</HelpModalTitle>
              <FullscreenCloseButton onClick={() => setShowHelp(false)}>
                <X size={20} />
              </FullscreenCloseButton>
            </HelpModalHeader>
            <HelpModalContent>
              <h4>텍스트 서식</h4>
              <ul>
                <li><strong>굵게:</strong> 텍스트 선택 후 <code>B</code> 버튼 또는 <code>**텍스트**</code></li>
                <li><strong>밑줄:</strong> 텍스트 선택 후 <code>U</code> 버튼 또는 <code>__텍스트__</code></li>
                <li><strong>취소선:</strong> 텍스트 선택 후 <code>S</code> 버튼 또는 <code>~~텍스트~~</code></li>
              </ul>
              
              <h4>링크</h4>
              <ul>
                <li>텍스트 선택 후 링크 버튼 클릭</li>
                <li>형식: <code>[텍스트](URL)</code></li>
              </ul>
              
              <h4>이미지</h4>
              <ul>
                <li>이미지 버튼 클릭 후 파일 선택</li>
                <li>로컬 이미지 파일을 선택하여 삽입</li>
                <li>형식: <code>![대체텍스트](blob:url)</code></li>
              </ul>
              
              <h4>표</h4>
              <ul>
                <li>표 버튼 클릭 시 행/열 수 선택</li>
                <li>선택한 크기에 맞는 표 템플릿 삽입</li>
                <li>형식: <code>| 제목 | 제목 |</code></li>
              </ul>
              
              <h4>기타</h4>
              <ul>
                <li><strong>정렬:</strong> 왼쪽/가운데/오른쪽 정렬</li>
                <li><strong>전체화면:</strong> ESC 키로 종료 가능</li>
              </ul>
            </HelpModalContent>
          </HelpModal>
        </>
      )}
      
      {showTableModal && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
            }}
            onClick={() => setShowTableModal(false)}
          />
          <TableModal onClick={(e) => e.stopPropagation()}>
            <TableModalHeader>
              <TableModalTitle>표 삽입</TableModalTitle>
              <FullscreenCloseButton onClick={() => setShowTableModal(false)}>
                <X size={20} />
              </FullscreenCloseButton>
            </TableModalHeader>
            <TableModalContent>
              <TableSizeInput>
                <TableSizeLabel>행 수</TableSizeLabel>
                <TableSizeInputs>
                  <TableSizeInputField
                    type="number"
                    min="1"
                    max="10"
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  />
                  <span style={{ color: '#6b7280' }}>행</span>
                </TableSizeInputs>
              </TableSizeInput>
              <TableSizeInput>
                <TableSizeLabel>열 수</TableSizeLabel>
                <TableSizeInputs>
                  <TableSizeInputField
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  />
                  <span style={{ color: '#6b7280' }}>열</span>
                </TableSizeInputs>
              </TableSizeInput>
            </TableModalContent>
            <TableModalButtons>
              <ModalButton onClick={() => setShowTableModal(false)}>
                취소
              </ModalButton>
              <ModalButton primary onClick={handleTableConfirm}>
                확인
              </ModalButton>
            </TableModalButtons>
          </TableModal>
        </>
      )}
    </EditorGroup>
  );
}

export default MessageEditor;

