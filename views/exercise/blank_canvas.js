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
        
        this.initCanvas();
        this.setupEvents();
    }

    initCanvas() {
        const parent = document.getElementById(this.parentId);
        parent.innerHTML = '';
        
        // 创建Canvas容器
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        parent.appendChild(canvasContainer);
        
        // 创建Canvas元素
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.id = this.canvasId;
        this.canvasElement.width = 60;  // 较大的物理尺寸
        this.canvasElement.height = 80;
        canvasContainer.appendChild(this.canvasElement);
        
        // 初始化Fabric.js（确保DOM已加载）
        this.fabricCanvas = new fabric.Canvas(this.canvasId, {
            isDrawingMode: true,
            backgroundColor: "#ffffff",
            preserveObjectStacking: true,
            renderOnAddRemove: false
        });
        
        // 设置笔刷属性（关键修改）
        this.fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(this.fabricCanvas);
        this.fabricCanvas.freeDrawingBrush.color = "#000000";
        this.fabricCanvas.freeDrawingBrush.width = 1 * (window.devicePixelRatio || 1); // 考虑DPI
        this.fabricCanvas.freeDrawingBrush.strokeLineCap = 'round';
        this.fabricCanvas.freeDrawingBrush.strokeLineJoin = 'round';
        
        // 适配高DPI设备
        this.adjustForHighDPI();
    }

    /**
     * 设置Canvas事件
     */
    setupEvents() {
        // 清除之前的预测结果当用户开始新的绘制
        this.fabricCanvas.on('mouse:down', () => {
            this.prediction = null;
        });
    }
    
    adjustForHighDPI() {
        const ratio = window.devicePixelRatio || 1;
        const canvas = this.fabricCanvas.lowerCanvasEl;
        
        // 调整CSS尺寸
        canvas.style.width = canvas.width / ratio + 'px';
        canvas.style.height = canvas.height / ratio + 'px';
    }

    /**
     * 获取当前Canvas内容的预测结果
     * @returns {Promise<string|null>} 预测的字符或null(如果空白)
     */

    async getPrediction() {
        if (this.fabricCanvas.isEmpty()) return null;
        let group = null;
        try {
            const objects = this.fabricCanvas.getObjects();
            if (objects.length === 0) return null;
            
            group = new fabric.Group(objects);
            const { left, top, width, height } = group;
            
            // 添加边界检查
            const scale = window.devicePixelRatio;
            const canvasWidth = this.fabricCanvas.width * scale;
            const canvasHeight = this.fabricCanvas.height * scale;
            
            const clampedLeft = Math.max(0, left * scale);
            const clampedTop = Math.max(0, top * scale);
            const clampedWidth = Math.min(width * scale, canvasWidth - clampedLeft);
            const clampedHeight = Math.min(height * scale, canvasHeight - clampedTop);
            
            // 设置willReadFrequently提示
            const ctx = this.fabricCanvas.contextContainer;
            ctx.canvas.willReadFrequently = true;
            
            const imageData = ctx.getImageData(
                clampedLeft,
                clampedTop,
                clampedWidth,
                clampedHeight
            );
            
            const [character] = await this.model.predict(imageData);
            return character;
        } catch (error) {
            console.error("预测失败:", error);
            return null;
        } finally {
            if (group) group.dispose();
        }
    }
    /**
     * 清空Canvas
     */
    clear() {
        this.fabricCanvas.clear();
        this.fabricCanvas.backgroundColor = '#ffffff';
        this.prediction = null;
    }
    
    /**
     * 检查Canvas是否有内容
     * @returns {boolean}
     */
    hasContent() {
        return !this.fabricCanvas.isEmpty();
    }
}