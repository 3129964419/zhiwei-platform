import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';

export default function KeyboardShortcuts() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的快捷键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Cmd/Ctrl + K: 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        addToast('info', '🔍 搜索功能开发中...');
      }

      // Cmd/Ctrl + N: 新建智能体
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/create');
      }

      // Cmd/Ctrl + D: 仪表盘
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        navigate('/dashboard');
      }

      // Cmd/Ctrl + H: 首页
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        navigate('/');
      }

      // Cmd/Ctrl + /: 显示快捷键帮助
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        addToast('info', '💡 快捷键: ⌘K搜索 ⌘N新建 ⌘D仪表盘 ⌘H首页');
      }

      // ?: 显示帮助
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        addToast('info', '💡 快捷键: ⌘K搜索 ⌘N新建 ⌘D仪表盘 ⌘H首页');
      }

      // Escape: 关闭弹窗/提示（由具体组件处理）
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, addToast]);

  return null;
}