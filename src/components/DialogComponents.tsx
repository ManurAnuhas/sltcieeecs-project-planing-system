import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X, CheckCircle, Info, AlertCircle } from 'lucide-react';

// --- Confirm Dialog ---------------------------------------------------------

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (isOpen) setTimeout(() => confirmRef.current?.focus(), 80); }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const colors = {
    danger:  { icon: <Trash2 size={22} />, iconBg: 'rgba(239,68,68,0.15)', iconColor: '#f87171', btnBg: 'linear-gradient(135deg,#dc2626,#ef4444)', btnShadow: '0 4px 14px rgba(239,68,68,0.45)', border: 'rgba(239,68,68,0.25)' },
    warning: { icon: <AlertTriangle size={22} />, iconBg: 'rgba(251,191,36,0.15)', iconColor: '#fbbf24', btnBg: 'linear-gradient(135deg,#d97706,#fbbf24)', btnShadow: '0 4px 14px rgba(251,191,36,0.45)', border: 'rgba(251,191,36,0.25)' },
    info:    { icon: <Info size={22} />, iconBg: 'rgba(6,182,212,0.15)', iconColor: '#22d3ee', btnBg: 'linear-gradient(135deg,#0284c7,#06b6d4)', btnShadow: '0 4px 14px rgba(6,182,212,0.45)', border: 'rgba(6,182,212,0.25)' },
  }[variant];

  return (
    <div onClick={onCancel} style={{ position:'fixed',inset:0,zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'rgba(15,23,42,0.96)',backdropFilter:'blur(24px)',border:`1px solid ${colors.border}`,borderRadius:'20px',padding:'32px 28px',width:'100%',maxWidth:'420px',boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ width:'52px',height:'52px',borderRadius:'14px',background:colors.iconBg,border:`1px solid ${colors.border}`,display:'flex',alignItems:'center',justifyContent:'center',color:colors.iconColor,marginBottom:'18px' }}>
          {colors.icon}
        </div>
        <h3 style={{ fontSize:'1.05rem',fontWeight:700,color:'#f3f4f6',marginBottom:'10px' }}>{title}</h3>
        <p style={{ fontSize:'0.9rem',color:'#9ca3af',lineHeight:1.65,marginBottom:'28px' }}>{message}</p>
        <div style={{ display:'flex',gap:'10px',justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'10px 20px',borderRadius:'10px',fontSize:'0.88rem',fontWeight:600,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',color:'#9ca3af',cursor:'pointer' }}>
            {cancelLabel}
          </button>
          <button ref={confirmRef} onClick={onConfirm} style={{ padding:'10px 22px',borderRadius:'10px',fontSize:'0.88rem',fontWeight:700,background:colors.btnBg,border:'none',color:'#fff',cursor:'pointer',boxShadow:colors.btnShadow }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Toast -------------------------------------------------------------------

interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ isOpen, message, type = 'info', onClose, duration = 3500 }) => {
  useEffect(() => { if (!isOpen) return; const t = setTimeout(onClose, duration); return () => clearTimeout(t); }, [isOpen, duration, onClose]);
  if (!isOpen) return null;
  const config = {
    success: { icon: <CheckCircle size={18}/>, color:'#4ade80', bg:'rgba(74,222,128,0.12)', border:'rgba(74,222,128,0.25)' },
    error:   { icon: <AlertCircle size={18}/>, color:'#f87171', bg:'rgba(248,113,113,0.12)', border:'rgba(248,113,113,0.25)' },
    warning: { icon: <AlertTriangle size={18}/>, color:'#fbbf24', bg:'rgba(251,191,36,0.12)', border:'rgba(251,191,36,0.25)' },
    info:    { icon: <Info size={18}/>, color:'#22d3ee', bg:'rgba(34,211,238,0.12)', border:'rgba(34,211,238,0.25)' },
  }[type];
  return (
    <div style={{ position:'fixed',bottom:'28px',right:'24px',zIndex:11000,display:'flex',alignItems:'center',gap:'12px',padding:'14px 18px',background:'rgba(15,23,42,0.95)',backdropFilter:'blur(16px)',border:`1px solid ${config.border}`,borderRadius:'14px',boxShadow:'0 12px 40px rgba(0,0,0,0.5)',maxWidth:'400px' }}>
      <div style={{ width:'36px',height:'36px',flexShrink:0,borderRadius:'9px',background:config.bg,border:`1px solid ${config.border}`,display:'flex',alignItems:'center',justifyContent:'center',color:config.color }}>
        {config.icon}
      </div>
      <span style={{ fontSize:'0.88rem',fontWeight:500,color:'#e5e7eb',lineHeight:1.5,flex:1 }}>{message}</span>
      <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'#6b7280',display:'flex',alignItems:'center' }}><X size={16}/></button>
    </div>
  );
};

// --- useConfirm hook ---------------------------------------------------------

interface ConfirmState {
  isOpen: boolean; title: string; message: string; confirmLabel: string;
  cancelLabel: string; variant: 'danger' | 'warning' | 'info';
  resolve: ((v: boolean) => void) | null;
}

export const useConfirm = () => {
  const [state, setState] = React.useState<ConfirmState>({
    isOpen:false, title:'', message:'', confirmLabel:'Confirm', cancelLabel:'Cancel', variant:'danger', resolve:null,
  });

  const confirm = (opts: { title:string; message:string; confirmLabel?:string; cancelLabel?:string; variant?:'danger'|'warning'|'info' }): Promise<boolean> =>
    new Promise(resolve => setState({ isOpen:true, title:opts.title, message:opts.message, confirmLabel:opts.confirmLabel??'Confirm', cancelLabel:opts.cancelLabel??'Cancel', variant:opts.variant??'danger', resolve }));

  const handleConfirm = () => { state.resolve?.(true); setState(s => ({ ...s, isOpen:false, resolve:null })); };
  const handleCancel  = () => { state.resolve?.(false); setState(s => ({ ...s, isOpen:false, resolve:null })); };

  const ConfirmDialogNode = (
    <ConfirmDialog isOpen={state.isOpen} title={state.title} message={state.message} confirmLabel={state.confirmLabel} cancelLabel={state.cancelLabel} variant={state.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
  );

  return { confirm, ConfirmDialogNode };
};

// --- useToast hook -----------------------------------------------------------

export const useToast = () => {
  const [state, setState] = React.useState<{ isOpen:boolean; message:string; type:'success'|'error'|'info'|'warning' }>({ isOpen:false, message:'', type:'info' });
  const toast = (message: string, type: 'success'|'error'|'info'|'warning' = 'info') => setState({ isOpen:true, message, type });
  const closeToast = () => setState(s => ({ ...s, isOpen:false }));
  const ToastNode = <Toast isOpen={state.isOpen} message={state.message} type={state.type} onClose={closeToast} />;
  return { toast, ToastNode };
};
