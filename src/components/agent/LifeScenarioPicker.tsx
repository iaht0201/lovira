import React from 'react';
import {
  X,
  Stethoscope,
  Building2,
  ShoppingBag,
  FileCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAgent } from '../../agent/AgentController';
import { LifeSessionType } from '../../agent/types';

export const LifeScenarioPicker: React.FC<{ onNavigate: (route: string) => void }> = ({
  onNavigate,
}) => {
  const { isLifeModalOpen, setIsLifeModalOpen, createSession } = useAgent();

  if (!isLifeModalOpen) return null;

  const scenarios: Array<{
    type: LifeSessionType;
    title: string;
    description: string;
    icon: any;
    color: string;
  }> = [
    {
      type: 'healthcare',
      title: 'Đi khám bệnh & Mua thuốc',
      description: 'Ghi âm dặn dò của bác sĩ, chụp đơn thuốc, nhắc giờ uống thuốc và tái khám.',
      icon: Stethoscope,
      color: 'bg-red-500/10 text-red-600',
    },
    {
      type: 'administrative',
      title: 'Làm thủ tục hành chính',
      description: 'Phân tích giấy tờ công chứng, hồ sơ một cửa, dịch từ ngữ pháp lý phức tạp.',
      icon: Building2,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      type: 'shopping',
      title: 'Đi siêu thị & Mua sắm',
      description: 'Nhìn hạn sử dụng sản phẩm, kiểm tra giá niêm yết, tính tổng tiền giỏ hàng.',
      icon: ShoppingBag,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      type: 'reading',
      title: 'Đọc tài liệu & Học tập',
      description: 'Đơn giản hóa bài học, giải thích từ chuyên môn và tóm tắt văn bản dài.',
      icon: FileCheck,
      color: 'bg-blue-500/10 text-blue-600',
    },
  ];

  const handleSelect = (type: LifeSessionType) => {
    createSession(type);
    setIsLifeModalOpen(false);
    onNavigate('/session');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-xl bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 id="scenario-title" className="font-bold text-xl text-text-primary">
              Chọn tình huống đời sống
            </h2>
          </div>
          <button
            onClick={() => setIsLifeModalOpen(false)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-text-secondary">
          Lovira Life Agent sẽ cấu hình các công cụ nhìn, nghe và ghi chép tối ưu theo mục đích của bạn:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <button
                key={sc.type}
                onClick={() => handleSelect(sc.type)}
                className="p-5 rounded-2xl bg-surface-subtle border border-border hover:border-primary text-left space-y-2.5 transition-all group hover:shadow-xs"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${sc.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-bold text-base text-text-primary group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>{sc.title}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xs text-text-secondary leading-relaxed">
                  {sc.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
