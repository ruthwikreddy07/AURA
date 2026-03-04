import { Bluetooth, Volume2, Sun, QrCode, Wifi } from "lucide-react";
import { cls } from "../../utils/cls";

const ICONS = {
    BLE: Bluetooth,
    Sound: Volume2,
    Light: Sun,
    QR: QrCode,
    NFC: Wifi,
};

export default function ModeBadge({ mode, active, size = 'md' }) {
    const Icon = ICONS[mode] || Wifi;
    const sizeClass = size === 'sm' ? 'px-2 py-1 text-[11px] gap-1.5' : 'px-2.5 py-1.5 text-xs gap-2';
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    const activeClass = active ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200';

    return (
        <div className={cls("flex items-center gap-2 font-semibold rounded-lg transition-colors", sizeClass, activeClass)}>
            <Icon className={iconSize} />
            <span>{mode}</span>
        </div>
    );
}