// api/create-pix.js
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Instancie o Mercado Pago usando a variável de ambiente
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});
const payment = new Payment(client);

export default async function handler(req, res) {
    // Configurando CORS para aceitar requisições
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Tratando requisições OPTIONS (pre-flight do CORS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas aceita POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não suportado. Use POST.' });
    }

    try {
        const { nome, email, cpf, valor } = req.body;

        // Validações básicas
        if (!nome || !email || !cpf) {
            return res.status(400).json({ error: 'Faltam dados obrigatórios (nome, email, cpf).' });
        }

        // Limpa o CPF mantendo apenas os números
        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length !== 11) {
            return res.status(400).json({ error: 'CPF inválido.' });
        }

        // Dividir nome e sobrenome
        const nameParts = nome.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Sem Sobrenome';

        // O valor deve ser 67.00
        const valorCobrado = Number(valor) || 67.00;

        // Gerando chave de idempotência para evitar cobranças duplicadas (exigência MP)
        const idempotencyKey = `pontoduplo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const paymentData = {
            body: {
                transaction_amount: valorCobrado,
                description: 'Rosa Dupla Prazer',
                payment_method_id: 'pix',
                payer: {
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    identification: {
                        type: 'CPF',
                        number: cleanCpf
                    }
                }
            },
            requestOptions: {
                idempotencyKey: idempotencyKey
            }
        };

        const paymentResponse = await payment.create(paymentData);

        const pixData = {
            paymentId: paymentResponse.id,
            status: paymentResponse.status,
            qrCode: paymentResponse.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: paymentResponse.point_of_interaction.transaction_data.qr_code_base64
        };

        return res.status(200).json({ success: true, pix: pixData });

    } catch (error) {
        console.error('Erro ao processar PIX:', error);
        const errorMessage = error.message || 'Erro interno no servidor.';
        return res.status(500).json({ error: 'Erro ao gerar PIX: SIM-9999', details: errorMessage });
    }
}
