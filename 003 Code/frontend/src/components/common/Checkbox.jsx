import React from "react";
import styled from "styled-components";

const CheckboxContainer = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
`;

const HiddenCheckbox = styled.input.attrs({ type: "checkbox" })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

// [수정 포인트 1] props.checked -> props.$checked
const StyledCheckbox = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid ${(props) => (props.$checked ? "#2563eb" : "#d1d5db")};
  background-color: ${(props) => (props.$checked ? "#2563eb" : "#ffffff")};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => (props.$checked ? "#1d4ed8" : "#9ca3af")};
  }

  ${HiddenCheckbox}:focus + & {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
`;

// [수정 포인트 2] props.checked -> props.$checked
const CheckIcon = styled.svg`
  width: 12px;
  height: 12px;
  stroke: #ffffff;
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: ${(props) => (props.$checked ? 1 : 0)};
  transition: opacity 0.2s ease;
`;

const IndeterminateIcon = styled.svg`
  width: 12px;
  height: 12px;
  stroke: #ffffff;
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

function Checkbox({ checked, onChange, indeterminate, ...props }) {
  const checkboxRef = React.useRef(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate || false;
    }
  }, [indeterminate]);

  return (
    <CheckboxContainer>
      <HiddenCheckbox
        ref={checkboxRef}
        checked={checked}
        onChange={onChange}
        {...props}
      />
      {/* [수정 포인트 3] DOM으로 전달되는 prop 이름 앞에 $ 붙이기 */}
      <StyledCheckbox
        $checked={checked || indeterminate}
        $indeterminate={indeterminate}
      >
        {indeterminate ? (
          <IndeterminateIcon viewBox="0 0 24 24">
            <line
              x1="4"
              y1="12"
              x2="20"
              y2="12"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </IndeterminateIcon>
        ) : (
          <CheckIcon $checked={checked} viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </CheckIcon>
        )}
      </StyledCheckbox>
    </CheckboxContainer>
  );
}

export default Checkbox;
