import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X } from 'lucide-react';
import loginWhite from '../../assets/login-white.svg';
import loginColor from '../../assets/login-color.svg';

// ============================================
// 전체 레이아웃 - 대시보드와 동일한 시스템
// viewport 전체를 사용하며 스크롤 없이 한 화면 구성
// ============================================
const LoginLayout = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  min-width: 1280px;
  overflow: hidden;
  background-color: #F8FAFC;
`;

// ============================================
// 왼쪽 영역 - 비주얼 컬럼 (50%)
// ============================================
const VisualColumn = styled.div`
  width: 50%;
  height: 100%;
  background: linear-gradient(135deg, #6EE7F9 0%, #3B82F6 45%, #1E3A8A 100%);
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
`;

const LogoIcon = styled.img`
  width: 48px;
  height: 48px;
  margin-bottom: auto;
`;

// 📌 중앙에서 살짝 아래 위치 (하단 정렬 X)
// 대시보드 진입 시 자연스러운 시선 흐름 유도
const LeftContent = styled.div`
  color: white;
  margin-top: auto;
  margin-bottom: 120px;
`;

const LeftSubText = styled.p`
  font-size: 20px;
  font-weight: 400;
  margin-bottom: 28px;
  opacity: 0.95;
  line-height: 1.6;
`;

const LeftTitle = styled.h1`
  font-size: 64px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
`;

// ============================================
// 오른쪽 영역 - 콘텐츠 컬럼 (50%)
// ============================================
const ContentColumn = styled.div`
  width: 50%;
  height: 100%;
  background: white;
  padding-left: 120px;
  padding-right: 80px;
  padding-top: 0;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
`;

// 📌 대시보드 콘텐츠 영역과 동일한 폭
// "카드"가 아닌 "페이지의 한 섹션"처럼 보이게
const FormContainer = styled.div`
  width: 100%;
  max-width: 520px;
`;

// 📌 대시보드 페이지 헤더와 동일한 느낌으로 좌측 정렬
const ServiceLogoIcon = styled.img`
  width: 48px;
  height: 48px;
  margin: 0 auto 20px auto;
  display: block;
`;

const ServiceName = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #2563EB;
  margin: 0 0 8px 0;
  text-align: center;
`;

const ServiceSubtitle = styled.p`
  font-size: 15px;
  color: #6B7280;
  margin: 0 0 48px 0;
  text-align: center;
`;

// ============================================
// 폼 스타일
// ============================================
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const InputLabel = styled.label`
  position: absolute;
  left: 16px;
  top: 8px;
  font-size: 13px;
  color: #9CA3AF;
  font-weight: 400;
  pointer-events: none;
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  height: 56px;
  padding: 26px 72px 8px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  background-color: white;
  box-sizing: border-box;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563EB;
  }

  &::placeholder {
    color: transparent;
  }
`;

const InputIconContainer = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ClearButton = styled.button`
  background-color: #9CA3AF;
  border: none;
  cursor: pointer;
  color: white;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #6B7280;
  }
`;

const EyeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #9CA3AF;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: color 0.2s ease;

  &:hover {
    color: #2563EB;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #6B7280;
  cursor: pointer;
  user-select: none;
`;

// 📌 대시보드 주요 액션 버튼과 동일한 스타일
const LoginButton = styled.button`
  width: 100%;
  height: 52px;
  background-color: #2563EB;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #1D4ED8;
  }

  &:disabled {
    background-color: #93C5FD;
    cursor: not-allowed;
  }
`;

const FooterLinks = styled.div`
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #9CA3AF;
`;

const FooterLink = styled.a`
  color: #9CA3AF;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #2563EB;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background-color: #FEE2E2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  color: #DC2626;
  font-size: 13px;
  text-align: center;
  margin-bottom: 16px;
`;

// ============================================
// 메인 컴포넌트
// ============================================
function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleClearUsername = () => {
    setFormData(prev => ({ ...prev, username: '' }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: 실제 로그인 API 호출
      // const response = await axios.post('/api/auth/login', formData);
      
      // 임시 로그인 처리 (개발용)
      setTimeout(() => {
        // 로그인 성공 시 토큰 저장
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', formData.username);
        
        // 아이디 기억하기 처리
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', formData.username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
        
        // 대시보드로 이동
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <LoginLayout>
      {/* 왼쪽 영역 - 비주얼 컬럼 (50%) */}
      <VisualColumn>
        <LogoIcon src={loginWhite} alt="유성 안심 문자" />
        <LeftContent>
          <LeftSubText>당신의 일상을 지키는 유성 안심 문자</LeftSubText>
          <LeftTitle>
            유성구의 안전 정보를<br />
            더 쉽고 빠르게,<br />
            더 가까이
          </LeftTitle>
        </LeftContent>
      </VisualColumn>

      {/* 오른쪽 영역 - 콘텐츠 컬럼 (50%) */}
      <ContentColumn>
        <FormContainer>
          <ServiceLogoIcon src={loginColor} alt="유성 안심 문자" />
          <ServiceName>유성 안심 문자 서비스</ServiceName>
          <ServiceSubtitle>관리자 로그인</ServiceSubtitle>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <Form onSubmit={handleSubmit}>
              {/* 아이디 입력 필드 */}
              <InputWrapper>
                <InputLabel htmlFor="username">아이디</InputLabel>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder=""
                  disabled={isLoading}
                />
                {formData.username && (
                  <InputIconContainer>
                    <ClearButton type="button" onClick={handleClearUsername}>
                      <X size={16} />
                    </ClearButton>
                  </InputIconContainer>
                )}
              </InputWrapper>

              {/* 비밀번호 입력 필드 */}
              <InputWrapper>
                <InputLabel htmlFor="password">비밀번호</InputLabel>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=""
                  disabled={isLoading}
                />
                <InputIconContainer>
                  <EyeButton type="button" onClick={togglePasswordVisibility}>
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </EyeButton>
                  {formData.password && (
                    <ClearButton type="button" onClick={() => setFormData(prev => ({ ...prev, password: '' }))}>
                      <X size={16} />
                    </ClearButton>
                  )}
                </InputIconContainer>
              </InputWrapper>

              {/* 아이디 기억하기 체크박스 */}
              <CheckboxWrapper>
                <Checkbox
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <CheckboxLabel htmlFor="rememberMe">
                  아이디 기억하기
                </CheckboxLabel>
              </CheckboxWrapper>

              {/* 로그인 버튼 */}
              <LoginButton type="submit" disabled={isLoading}>
                {isLoading ? '로그인 중...' : '로그인'}
              </LoginButton>
            </Form>

            {/* 하단 링크 */}
            <FooterLinks>
              <FooterLink>아이디 찾기</FooterLink>
              {' | '}
              <FooterLink>비밀번호 찾기</FooterLink>
            </FooterLinks>
          </FormContainer>
        </ContentColumn>
    </LoginLayout>
  );
}

export default Login;



