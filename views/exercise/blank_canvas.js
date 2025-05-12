/**
 * BlankCanvas Component - 可复用的手写输入区域
 */
class BlankCanvas {
    /**
     * @param {string} parentId - 父容器元素的ID
     * @param {Model} model - 已初始化的Model实例
     */
    constructor(parentId, model) {
        this.parentId = parentId;
        this.model = model;
        this.canvasId = `${parentId}-canvas`;
        this.prediction = null;
        this.isRecognized = false;
        
        this.initCanvas();
        this.setupEvents();
    }

    initCanvas() {
        const parent = document.getElementById(this.parentId);
        if (!parent) {
            console.error(`父元素 ${this.parentId} 不存在`);
            return;
        }
        
        // 清空父容器
        parent.innerHTML = '';
        
        // 创建Canvas元素
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.id = this.canvasId;
        this.canvasElement.width = parent.clientWidth;  // 使用父元素的宽度
        this.canvasElement.height = parent.clientHeight; // 使用父元素的高度
        parent.appendChild(this.canvasElement);
        
        // 初始化Fabric.js
        this.fabricCanvas = new fabric.Canvas(this.canvasId, {
            isDrawingMode: true,
            backgroundColor: "#ffffff",
            width: parent.clientWidth,
            height: parent.clientHeight
        });
        
        // 设置笔刷属性
        this.fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(this.fabricCanvas);
        this.fabricCanvas.freeDrawingBrush.color = "#000000";
        this.fabricCanvas.freeDrawingBrush.width = 3;
        
        // 调整canvas大小以适应父容器
        this.adjustCanvasSize();
    }

    adjustCanvasSize() {
        const parent = document.getElementById(this.parentId);
        if (!parent || !this.fabricCanvas) return;
        
        // 设置canvas尺寸与父容器一致
        this.fabricCanvas.setWidth(parent.clientWidth);
        this.fabricCanvas.setHeight(parent.clientHeight);
        this.fabricCanvas.calcOffset();
    }

    /**
     * 设置Canvas事件
     */
    setupEvents() {
        // 清除之前的预测结果当用户开始新的绘制
        this.fabricCanvas.on('mouse:down', () => {
            this.prediction = null;
        });
        
        // 绘制完成后进行预测
        this.fabricCanvas.on('mouse:up', async () => {
            if (this.fabricCanvas.isEmpty()) return;
            
            // 延迟一点时间确保绘制完成
            setTimeout(async () => {
                const [prediction, confidence] = await this.getPrediction();
                if (prediction && confidence > 0.5) {
                    // 将预测结果显示在父元素中
                    const parent = document.getElementById(this.parentId);
                    parent.setAttribute('data-prediction', prediction);
                    // prediction 转成小写
                    parent.textContent = prediction.toLowerCase();
                    
                    // 记录该空格已被识别
                    this.isRecognized = true;
                }
            }, 1000);
        });
        
        // 响应窗口大小变化
        window.addEventListener('resize', () => {
            this.adjustCanvasSize();
        });
    }

    /**
     * 获取当前Canvas内容的预测结果
     * @returns {Promise<string|null>} 预测的字符或null(如果空白)
     */
    async getPrediction() {
        if (!this.model || this.fabricCanvas.isEmpty()) return [null, 0];
        
        try {
            // 获取canvas的数据URL
            const dataURL = this.fabricCanvas.toDataURL();
            
            // 创建图像对象
            const img = new Image();
            img.src = dataURL;
            
            // 等待图像加载
            await new Promise(resolve => {
                img.onload = resolve;
            });
            
            // 创建临时canvas获取像素数据
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // 获取像素数据
            const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            // 使用模型预测
            return await this.model.predict(imageData);
        } catch (error) {
            console.error("预测失败:", error);
            return [null, 0];
        }
    }

    /**
     * 清空Canvas
     */
    clear() {
        if (this.fabricCanvas) {
            // 清除所有对象但保持绘图状态
            this.fabricCanvas.clear();
            this.fabricCanvas.backgroundColor = '#ffffff';
            
            // 确保绘图模式仍然启用
            this.fabricCanvas.isDrawingMode = true;
            
            // 重新设置笔刷属性
            this.fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(this.fabricCanvas);
            this.fabricCanvas.freeDrawingBrush.color = "#000000";
            this.fabricCanvas.freeDrawingBrush.width = 3;
            
            // 重新渲染
            this.fabricCanvas.renderAll();
            
            // 清除父元素中的文本
            // const parent = document.getElementById(this.parentId);
            // if (parent) {
            //     //parent.textContent = '';
            // }
        }
    }
}