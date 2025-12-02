const gridContainer = document.getElementById("gridContainer");
const colorPicker = document.getElementById("colorPicker");
const gridWidthInput = document.getElementById("gridWidth");
const gridHeightInput = document.getElementById("gridHeight");
const setGridBtn = document.getElementById("setGridBtn");
const resetBtn = document.getElementById("resetBtn");

const jsonOutput = document.getElementById("jsonOutput");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const copyBtn = document.getElementById("copyBtn");

let currentWidth = parseInt(gridWidthInput.value);
let currentHeight = parseInt(gridHeightInput.value);
let currentColor = colorPicker.value;
let isDrawing = false;

function hexToRgb(hex){
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

function rgbToHex(r, g, b){
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function createGrid(width, height){
  gridContainer.innerHTML = "";

  const maxContainerSize = 480;
  const maxDim = Math.max(width, height);
  const pixelSize = maxContainerSize / maxDim;

  gridContainer.style.width = `${width * pixelSize}px`;
  gridContainer.style.height = `${height * pixelSize}px`;
  gridContainer.style.display = "grid";

  gridContainer.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${height}, 1fr)`;

  for(let i = 0; i < width * height; i++){
    const pixel = document.createElement("div");
    pixel.classList.add("pixel");

    const row = Math.floor(i / width);
    const col = i % width;
    pixel.dataset.col = col;
    pixel.dataset.row = row;

    pixel.style.backgroundColor = "transparent";

    pixel.addEventListener("mousedown", startDrawing);
    pixel.addEventListener("mouseover", drawPixel);

    gridContainer.appendChild(pixel);
  }

  currentWidth = width;
  currentHeight = height;
}

function applyColor(pixel){
  pixel.style.backgroundColor = currentColor;
}

function startDrawing(event){
  if(event.button === 0){
    isDrawing = true;
    applyColor(event.target);
  }
}

function drawPixel(event){
  if(isDrawing && event.target.classList.contains("pixel")){
    applyColor(event.target);
  }
}

function stopDrawing(){
  isDrawing = false;
}

function exportGridToJson(){
  const pixels = document.querySelectorAll("#gridContainer .pixel");
  const pixelData = [];

  pixels.forEach(pixel=>{
    const style = window.getComputedStyle(pixel);
    const bgColor = style.backgroundColor;

    if(bgColor === "transparent" || bgColor === "rgba(0, 0, 0, 0)") return;

    const rgbMatch = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/)||bgColor.match(/rgba\((\d+), (\d+), (\d+),.*\)/);
    if(!rgbMatch) return;

    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);

    if(
      r === 0&&
      g === 0&&
      b === 0
    ) return;

    const col = parseInt(pixel.dataset.col);
    const rowBrowser = parseInt(pixel.dataset.row);

    const yInverted = currentHeight - 1 - rowBrowser;

    pixelData.push({
      "x": col,
      "y": yInverted,
      "r": r,
      "g": g,
      "b": b
    });
  });

  jsonOutput.value = JSON.stringify(pixelData, null, 2);
}

function importGridFromJson(){
  try{
    const jsonString = jsonOutput.value.trim();
    if(!jsonString) return alert("JSONデータが入力されていません");

    const pixelData = JSON.parse(jsonString);
    if(!Array.isArray(pixelData)) throw new Error("JSONデータは配列形式である必要があります");

    const pixels = document.querySelectorAll("#gridContainer .pixel");
    pixels.forEach(p=>p.style.backgroundColor = "transparent");

    let maxX = 0;
    let maxY = 0;

    pixelData.forEach(data=>{
      if(data.x < 0 || data.y < 0 || data.x >= currentWidth || data.y >= currentHeight){
        maxX = Math.max(maxX, data.x);
        maxY = Math.max(maxY, data.y);
      }
    });

    if(maxX > currentWidth || maxY > currentHeight){
      const confirmResize = confirm(`インポートに必要なサイズは (${maxX + 1}x${maxY + 1}) ですが、現在のグリッドは (${currentWidth}x${currentHeight}) です。グリッドをリサイズして描画しますか？ (キャンセルした場合、サイズ外のピクセルは無視されます)`);
      if(confirmResize){
        const newWidth = Math.max(currentWidth, maxX + 1);
        const newHeight = Math.max(currentHeight, maxY + 1);

        gridWidthInput.value = newWidth;
        gridHeightInput.value = newHeight;

        createGrid(newWidth, newHeight);
      }
    }

    if(maxX < currentWidth || maxY < currentHeight){
      const confirmResize = confirm(`インポートに必要なサイズは (${maxX + 1}x${maxY + 1}) ですが、現在のグリッドは (${currentWidth}x${currentHeight}) です。グリッドをリサイズして描画しますか？ (キャンセルした場合、サイズ外にピクセルが設置されます)`);
      if(confirmResize){
        const newWidth = Math.min(currentWidth, maxX + 1);
        const newHeight = Math.min(currentHeight, maxY + 1);

        gridWidthInput.value = newWidth;
        gridHeightInput.value = newHeight;

        createGrid(newWidth, newHeight);
      }
    }

    pixelData.forEach(data=>{
      const x = data.x;
      const yInverted = data.y;
      const r = data.r;
      const g = data.g;
      const b = data.b;

      const rowBrowser = currentHeight - 1 - yInverted;

      if(x >= 0 && x < currentWidth && rowBrowser >= 0 && rowBrowser < currentHeight){
        const pixel = document.querySelector(`.pixel[data-col="${x}"][data-row="${rowBrowser}"]`);

        if(pixel){
          pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        }
      }
    });

    alert("JSONデータをインポートしました");
  }catch(error){
    alert("JSONデータの解析中にエラーが発生しました\n" + error.message);
    console.error(error);
  }
}

colorPicker.addEventListener("input",()=>{
  currentColor = colorPicker.value;
});

setGridBtn.addEventListener("click",()=>{
  const newWidth = parseInt(gridWidthInput.value);
  const newHeight = parseInt(gridHeightInput.value);

  const isValid = (val) => val >= 1 && val <= 128;

  if(isValid(newWidth) && isValid(newHeight)){
    if(newWidth !== currentWidth || newHeight !== currentHeight){
      createGrid(newWidth, newHeight);
    }
  }else{
    alert("グリッドの幅(ROW)と高さ(COLUMN)は1から128の間で設定してください");

    gridWidthInput.value = currentWidth;
    gridHeightInput.value = currentHeight;
  }
});

resetBtn.addEventListener("click",()=>{
  if(confirm("すべて消去しますか？")){
    createGrid(currentWidth, currentHeight);
  }
});

copyBtn.addEventListener("click",()=>{
  if(!navigator.clipboard) return alert("このブラウザはクリップボードに対応していません");

  navigator.clipboard.writeText(jsonOutput.value)
    .then(()=>{
      alert("コピーしました");
    });
});

document.addEventListener("mouseup", stopDrawing);

exportBtn.addEventListener("click", exportGridToJson);
importBtn.addEventListener("click", importGridFromJson);

createGrid(currentWidth, currentHeight);