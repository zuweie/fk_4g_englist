class Model {
    constructor() {
        this.alphabet = "abcdefghijklmnopqrstuvwxyz";
        this.characters = "0123456789" + this.alphabet.toUpperCase() + this.alphabet;
        this.isWarmedUp = this.loadModel()
            .then(this.warmUp.bind(this))
            .then(() => console.info("模型就绪，后端:", tf.getBackend()));
    }

    async loadModel() {
        console.time("模型加载");
        try {
            this._model = await tf.loadLayersModel("/exercise/model/model.json");
            console.timeEnd("模型加载");
            return this._model;
        } catch (error) {
            console.error("模型加载失败:", error);
            throw error;
        }
    }

    warmUp() {
        console.time("预热");
        // 使用正确维度的张量进行预热
        const warmupTensor = tf.zeros([1, 28, 28, 1]);
        this._model.predict(warmupTensor).dataSync();
        warmupTensor.dispose();
        console.timeEnd("预热");
    }

    preprocessImage(pixelData) {
        return tf.tidy(() => {
            const targetDim = 28;
            
            // 转换为张量并添加批次维度
            let tensor = tf.browser.fromPixels(pixelData, 1)
                .toFloat()
                .div(255.0)
                .sub(1.0)
                .abs();
            
            // 计算有效内容区域
            const { top, left, height, width } = this.calculateBoundingBox(tensor);
            
            // 裁剪有效区域
            tensor = tensor.slice([top, left], [height, width]);
            
            // 等比例缩放
            const scale = Math.min(targetDim / width, targetDim / height) * 0.8;
            const newWidth = Math.floor(width * scale);
            const newHeight = Math.floor(height * scale);
            
            tensor = tf.image.resizeBilinear(tensor, [newHeight, newWidth]);
            
            // 居中填充到28x28
            const padY = Math.floor((targetDim - newHeight) / 2);
            const padX = Math.floor((targetDim - newWidth) / 2);
            
            return tensor.pad([
                [padY, targetDim - newHeight - padY],
                [padX, targetDim - newWidth - padX],
                [0, 0]
            ], 0)
            .expandDims(0); // 添加批次维度 [1,28,28,1]
        });
    }

    calculateBoundingBox(tensor) {
        const data = tensor.dataSync();
        const [imgHeight, imgWidth] = tensor.shape;
        
        let minX = imgWidth, minY = imgHeight, maxX = 0, maxY = 0;
        const threshold = 0.1;
        
        for (let y = 0; y < imgHeight; y++) {
            for (let x = 0; x < imgWidth; x++) {
                if (data[y * imgWidth + x] > threshold) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        // 添加边距并确保不越界
        const margin = 2;
        return {
            left: Math.max(0, minX - margin),
            top: Math.max(0, minY - margin),
            width: Math.min(imgWidth, maxX - minX + 2 * margin + 1),
            height: Math.min(imgHeight, maxY - minY + 2 * margin + 1)
        };
    }

    predict(pixelData) {
        if (!this._model) {
            console.warn("模型未加载!");
            return [null, 0];
        }

        let startTime = performance.now();
        try {
            const tensor = this.preprocessImage(pixelData);
            // 在predict方法中添加检查
            console.assert(tensor.shape.length === 4,
                `输入张量应为4维，实际得到: ${tensor.shape}`);

            const prediction = this._model.predict(tensor).as1D();
            const argMax = prediction.argMax().dataSync()[0];
            const probability = prediction.max().dataSync()[0];
            const character = this.characters[argMax];
            
            console.log(`预测完成 (${Math.round(performance.now() - startTime)}ms):`, 
                character, "置信度:", probability);
            
            return [character, probability];
        } catch (error) {
            console.error("预测错误:", error);
            return [null, 0];
        } finally {
            // 在预测后添加内存检查
            console.log('内存状态:', tf.memory().numTensors);
        }
    }
}