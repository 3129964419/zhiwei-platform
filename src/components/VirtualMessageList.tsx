import { useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import MessageBubble from './MessageBubble';
import type { Message } from '@/types';

interface VirtualMessageListProps {
  messages: Message[];
  agentName: string;
  agentGradient: [string, string];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function VirtualMessageList({
  messages,
  agentName,
  agentGradient,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: VirtualMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // 估算每条消息的高度
  const estimateSize = useCallback((index: number) => {
    const message = messages[index];
    if (!message) return 80;

    // 根据内容长度估算高度
    const contentLength = message.content.length;
    const baseHeight = 60; // 基础高度（头像 + 内边距）
    const charsPerLine = 30; // 每行大约 30 个字符
    const lineHeight = 20; // 每行高度

    const lines = Math.ceil(contentLength / charsPerLine);
    const estimatedHeight = baseHeight + lines * lineHeight;

    // 限制最小和最大高度
    return Math.max(60, Math.min(estimatedHeight, 300));
  }, [messages]);

  // 创建虚拟化器
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // 预渲染 5 条消息
  });

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (parentRef.current && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [virtualizer, messages.length]);

  // 新消息时自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      // 延迟滚动，等待 DOM 更新
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  // 检测滚动到顶部，加载更多
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !onLoadMore || !hasMore || isLoading) return;

    const { scrollTop } = parentRef.current;
    if (scrollTop < 100) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoading]);

  // 获取虚拟项目
  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{ contain: 'strict' }}
    >
      {/* 加载更多指示器 */}
      {hasMore && (
        <div className="flex justify-center py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-ink-900/40 text-sm">
              <div className="w-4 h-4 border-2 border-iris-500 border-t-transparent rounded-full animate-spin" />
              加载中...
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="text-iris-500 text-sm hover:underline"
            >
              加载更多消息
            </button>
          )}
        </div>
      )}

      {/* 虚拟列表容器 */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => {
          const message = messages[virtualRow.index];
          if (!message) return null;

          return (
            <div
              key={message.id || virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageBubble
                message={message}
                agentAvatar={agentName}
                agentGradient={agentGradient}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
