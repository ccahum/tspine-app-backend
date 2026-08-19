/**
 * "Ahora" en hora de Ciudad de México, pero guardado como si fuera UTC. El resto de la app
 * (formatDateTime en frontend, etc.) lee los dígitos del timestamp asumiendo que ya son hora
 * local — así vienen los datos históricos importados de AppSheet, sin zona horaria real. Si
 * guardáramos new Date() (UTC real), se vería 6 horas adelantado al mostrarse.
 * México no observa horario de verano desde 2022, por lo que el offset fijo es seguro.
 */
export const nowMexico = (): Date => new Date(Date.now() - 6 * 60 * 60 * 1000);
