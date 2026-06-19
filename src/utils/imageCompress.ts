/**
 * 图片压缩工具
 * 用于在上传前压缩图片，减少网络传输和存储空间
 */

export interface CompressionOptions {
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 压缩质量 (0-1) */
  quality?: number;
  /** 输出格式 */
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** 是否保持宽高比 */
  keepAspectRatio?: boolean;
  /** 最大文件大小（字节） */
  maxSize?: number;
}

export interface CompressionResult {
  /** 压缩后的 Blob */
  blob: Blob;
  /** 压缩后的 Data URL */
  dataUrl: string;
  /** 原始宽度 */
  originalWidth: number;
  /** 原始高度 */
  originalHeight: number;
  /** 压缩后宽度 */
  width: number;
  /** 压缩后高度 */
  height: number;
  /** 原始文件大小 */
  originalSize: number;
  /** 压缩后文件大小 */
  compressedSize: number;
  /** 压缩比例 */
  compressionRatio: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'image/jpeg',
  keepAspectRatio: true,
  maxSize: 2 * 1024 * 1024, // 2MB
};

/**
 * 压缩图片文件
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }

  // 验证文件大小（最大 20MB）
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('图片大小不能超过 20MB');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('读取图片失败'));
    };

    img.onload = () => {
      try {
        const result = processImage(img, file.size, opts);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('加载图片失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 处理图片压缩
 */
async function processImage(
  img: HTMLImageElement,
  originalSize: number,
  options: Required<CompressionOptions>
): Promise<CompressionResult> {
  const { maxWidth, maxHeight, quality, format, keepAspectRatio, maxSize } = options;

  let width = img.naturalWidth;
  let height = img.naturalHeight;

  // 计算缩放比例
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // 创建 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文');
  }

  // 绘制图片
  ctx.drawImage(img, 0, 0, width, height);

  // 转换为 Blob
  const dataUrl = canvas.toDataURL(format, quality);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('图片压缩失败'));
          return;
        }

        // 如果压缩后仍然超过最大大小，递归压缩
        if (blob.size > maxSize && quality > 0.1) {
          const newQuality = Math.max(0.1, quality - 0.1);
          processImage(img, originalSize, {
            ...options,
            quality: newQuality,
          }).then(resolve).catch(reject);
          return;
        }

        resolve({
          blob,
          dataUrl,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          width,
          height,
          originalSize,
          compressedSize: blob.size,
          compressionRatio: originalSize / blob.size,
        });
      },
      format,
      quality
    );
  });
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (const file of files) {
    try {
      const result = await compressImage(file, options);
      results.push(result);
    } catch (error) {
      console.error(`压缩图片 ${file.name} 失败:`, error);
    }
  }

  return results;
}

/**
 * 获取图片信息
 */
export async function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
      });
    };

    img.onerror = () => {
      reject(new Error('无法获取图片信息'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 将 Blob 转换为 File
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type });
}

/**
 * 创建图片缩略图
 */
export async function createThumbnail(
  file: File,
  size: number = 200
): Promise<string> {
  const result = await compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'image/jpeg',
  });

  return result.dataUrl;
}
