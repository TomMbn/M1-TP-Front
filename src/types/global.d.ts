import { Socket } from "socket.io-client";

declare global {
    interface Window {
        __SOCKET__?: Socket;
    }

    interface Navigator {
        getBattery?: () => Promise<BatteryManager>;
    }

    interface BatteryManager extends EventTarget {
        charging: boolean;
        chargingTime: number;
        dischargingTime: number;
        level: number;
        onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
        onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
        ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
        onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
    }
}

export { };
