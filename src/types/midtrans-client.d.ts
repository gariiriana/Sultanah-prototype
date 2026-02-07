declare module 'midtrans-client' {
    export class Snap {
        constructor(options: {
            isProduction: boolean;
            serverKey: string;
            clientKey: string;
        });
        createTransaction(parameter: any): Promise<any>;
    }
    export class CoreApi {
        constructor(options: {
            isProduction: boolean;
            serverKey: string;
            clientKey: string;
        });
        charge(parameter: any): Promise<any>;
    }
}
