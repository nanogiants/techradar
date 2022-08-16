const fontFace = `
  @font-face{
      font-family: 'SharpGroteskBook19';
      font-style: normal;
      font-weight: normal;
      src: url('./fonts/SharpGroteskBook19.otf') format("opentype");
  }

  @font-face{
      font-family: 'SharpGroteskBook19';
      font-style: normal;
      font-weight: bold;
      src: url('./fonts/SharpGroteskBook19.otf') format("opentype");
  }
`;

export default (): void => {
  const style = document.createElement('style');
  style.innerHTML = fontFace;
  document.head.appendChild(style);
};
