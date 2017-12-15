import * as Logger from 'console';
import * as os from 'os';

export class Ip {
    public static get(): IIpData[] {
        if (this.lastUpdate + this.UPDATE_FREQUENCY <= Date.now()) {
            const ifaces = os.networkInterfaces();
            this.ips = [];
            this.lastUpdate = Date.now();

            Object.keys(ifaces).forEach((ifname) => {
                let alias: number = 0;

                ifaces[ifname].forEach((iface) => {
                    if ('IPv4' !== iface.family || iface.internal !== false) {
                        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                        return;
                    }

                    if (alias > 0) {
                        // this single interface has multiple ipv4 addresses
                        // Logger.log(ifname + ':' + alias, iface.address);
                        this.ips.push({
                            ip: iface.address,
                            name: `${ifname}:${alias}`,
                        });
                    } else {
                        // this interface has only one ipv4 adress
                        // Logger.log(ifname, iface.address);
                        this.ips.push({
                            ip: iface.address,
                            name: ifname,
                        });
                    }

                    alias++;
                });
            });
        }

        return this.ips;
    }

    private static readonly UPDATE_FREQUENCY: number = 60 * 60 * 1000;
    private static lastUpdate: number = 0;
    private static ips: IIpData[];
}

export interface IIpData {
    name: string;
    ip: string;
}
