export declare class LoginResponseDto {
    accessToken: string;
    usuario: {
        id: string;
        nombreCompleto: string;
        correo: string | null;
        perfilId: string | null;
        perfilNombre: string;
        reglas: string;
        sedeId: string | null;
    };
}
