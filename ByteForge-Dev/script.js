let currentOperation = 'gen';
let currentType = 'cpf';

// Controle do Modal de Termos - Sempre aparece ao carregar
window.onload = function() {
    const modal = document.getElementById('terms-modal');
    modal.style.display = 'flex';
    
    // Pequeno delay para a transição de opacidade (fade-in) funcionar
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 50);
}

function acceptTerms() {
    const modal = document.getElementById('terms-modal');
    modal.style.opacity = '0'; // Suaviza a saída
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 500); // Tempo da transição de saída
}

function rejectTerms() {
    alert("Você precisa aceitar os termos para utilizar a ferramenta.");
    window.location.href = "https://google.com";
}
const mapaEstados = {
    "01": "SP", "02": "MG", "03": "RJ", "04": "RS", "05": "BA", "06": "PR", "07": "CE",
    "08": "PE", "09": "SC", "10": "GO", "11": "MA", "12": "PB", "13": "PA", "14": "ES",
    "15": "PI", "16": "RN", "17": "AL", "18": "MT", "19": "MS", "20": "DF", "21": "SE",
    "22": "AM", "23": "RO", "24": "AC", "25": "AP", "26": "RR", "27": "TO"
};

const faixasCEP = [
    { uf: "SP", min: 1000000, max: 19999999 }, { uf: "RJ", min: 20000000, max: 28999999 },
    { uf: "ES", min: 29000000, max: 29999999 }, { uf: "MG", min: 30000000, max: 39999999 },
    { uf: "BA", min: 40000000, max: 48999999 }, { uf: "SE", min: 49000000, max: 49999999 },
    { uf: "PE", min: 50000000, max: 56999999 }, { uf: "AL", min: 57000000, max: 57999999 },
    { uf: "PB", min: 58000000, max: 58999999 }, { uf: "RN", min: 59000000, max: 59999999 },
    { uf: "CE", min: 60000000, max: 63999999 }, { uf: "PI", min: 64000000, max: 64999999 },
    { uf: "MA", min: 65000000, max: 65999999 }, { uf: "PA", min: 66000000, max: 68899999 },
    { uf: "AP", min: 68900000, max: 68999999 }, { uf: "AM", min: 69000000, max: 69299999 },
    { uf: "RR", min: 69300000, max: 69399999 }, { uf: "AC", min: 69900000, max: 69999999 },
    { uf: "DF", min: 70000000, max: 72799999 }, { uf: "GO", min: 72800000, max: 72999999 },
    { uf: "TO", min: 77000000, max: 77999999 }, { uf: "MT", min: 78000000, max: 78899999 },
    { uf: "RO", min: 78900000, max: 78999999 }, { uf: "MS", min: 79000000, max: 79999999 },
    { uf: "PR", min: 80000000, max: 87999999 }, { uf: "SC", min: 88000000, max: 89999999 },
    { uf: "RS", min: 90000000, max: 99999999 }
];

// Listener para resetar a mensagem ao digitar
document.getElementById('main-input').addEventListener('input', function() {
    document.getElementById('result-label').style.display = "none";
});

function setMode(m) {
    currentOperation = m;
    
    // 1. Lida com o visual dos botões de cima (Gerar/Validar)
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // 2. PEGA O BOTAO AZUL PELO ID
    const botaoAzul = document.getElementById('action-btn');
    const botaoSecundario = document.getElementById('secondary-btn');

    // 3. TROCA O NOME BASEADO NO MODO
    if (m === 'val') {
        // MODO VALIDAR
        botaoAzul.innerText = "COLAR"; 
        botaoSecundario.innerText = "LIMPAR";
    } else {
        // MODO GERAR
        botaoAzul.innerText = "GERAR AGORA";
        botaoSecundario.innerText = "COPIAR";
    }
    
    resetDisplay();
    updateTitle();
    checkBrandVisibility();
}

function switchTab(el) {
    currentType = el.getAttribute('data-type');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    resetDisplay();
    updateTitle();
    checkBrandVisibility();
}

function resetDisplay() {
    const input = document.getElementById('main-input');
    const res = document.getElementById('result-label');
    input.value = ""; 
    res.style.display = "none";
    input.readOnly = (currentOperation === 'gen');
    input.placeholder = (currentOperation === 'val') ? "Cole ou digite para validar..." : "---";
}

function checkBrandVisibility() {
    document.getElementById('brand-selector').style.display = (currentType === 'cc' && currentOperation === 'gen') ? "block" : "none";
    document.getElementById('pass-length-selector').style.display = (currentType === 'pass' && currentOperation === 'gen') ? "block" : "none";
    document.getElementById('state-selector').style.display = ((currentType === 'rg' || currentType === 'titulo') && currentOperation === 'gen') ? "block" : "none";
}

function updateTitle() {
    const opName = currentOperation === 'gen' ? 'Gerador' : 'Validador';
    document.getElementById('title').innerText = `${opName} de ${currentType.toUpperCase()}`;
}

// Ação do Botão Azul (action-btn)
async function execute() {
    const input = document.getElementById('main-input');
    
    if (currentOperation === 'gen') {
        // Se estiver no modo GERAR, ele executa a geração normal
        generate();
    } else {
        // MODO VALIDAR: O botão agora é COLAR
        try {
            // Tenta ler o texto da área de transferência do usuário
            const text = await navigator.clipboard.readText();
            
            if (text) {
                input.value = text.trim(); // Coloca o texto no campo
                validate(); // Chama a validação na mesma hora!
            }
        } catch (err) {
            // Se o navegador bloquear o acesso (permissão), 
            // ele apenas valida o que já estiver escrito no campo.
            console.error("Erro ao ler área de transferência: ", err);
            validate();
        }
    }
}

// Função de Validação (Garante que a mensagem apareça corretamente)
function validate() {
    const raw = document.getElementById('main-input').value;
    const label = document.getElementById('result-label');
    
    if (!raw) {
        label.style.display = "block";
        label.innerText = "✕ CAMPO VAZIO";
        label.style.color = "#ef4444";
        return;
    }
    
    // Limpa apenas números para validar (exceto RG que pode ter X)
    const clean = raw.replace(/\D/g, '');
    let isValid = false;
    let message = "";

    // Lógica por tipo
    switch(currentType) {
        case 'cpf':
            isValid = validarCPF(clean);
            message = isValid ? "✓ CPF VÁLIDO" : "✕ CPF INVÁLIDO";
            break;
        case 'cep':
            // Verifica se tem 8 dígitos
            isValid = clean.length === 8;
            message = isValid ? "✓ CEP VÁLIDO" : "✕ CEP INVÁLIDO";
            break;
        case 'cnpj':
            isValid = clean.length === 14; // Adicione sua função de CNPJ aqui se tiver
            message = isValid ? "✓ CNPJ VÁLIDO" : "✕ CNPJ INVÁLIDO";
            break;
        // Adicione os outros cases (rg, titulo, etc) conforme sua necessidade
        default:
            isValid = clean.length >= 5;
            message = isValid ? "✓ FORMATO VÁLIDO" : "✕ FORMATO INVÁLIDO";
    }

    // Exibe o resultado na tela
    label.style.display = "block";
    label.innerText = message;
    label.style.color = isValid ? "#22c55e" : "#ef4444";
}

// --- GERAÇÃO ---

function genRG() {
    const r = () => Math.floor(Math.random() * 9);
    const uf = document.getElementById('state-selector').value;
    const codUF = Object.keys(mapaEstados).find(key => mapaEstados[key] === uf) || "01";
    let n = [parseInt(codUF[0]), parseInt(codUF[1]), r(), r(), r(), r(), r(), r()];
    let soma = (n[0]*2) + (n[1]*3) + (n[2]*4) + (n[3]*5) + (n[4]*6) + (n[5]*7) + (n[6]*8) + (n[7]*9);
    let resto = soma % 11;
    let dv = (resto === 0) ? 0 : (resto === 10) ? "X" : 11 - resto;
    return `${n[0]}${n[1]}.${n[2]}${n[3]}${n[4]}.${n[5]}${n[6]}${n[7]}-${dv}`;
}

function genTitulo() {
    const r = () => Math.floor(Math.random() * 9);
    const uf = document.getElementById('state-selector').value;
    const codUF = Object.keys(mapaEstados).find(key => mapaEstados[key] === uf) || "01";
    let n = Array.from({length: 8}, r);
    let s1 = (n[0]*2)+(n[1]*3)+(n[2]*4)+(n[3]*5)+(n[4]*6)+(n[5]*7)+(n[6]*8)+(n[7]*9);
    let dv1 = s1 % 11; if (dv1 === 10) dv1 = 0;
    let u = codUF.split('').map(Number);
    let s2 = (u[0]*7) + (u[1]*8) + (dv1*9);
    let dv2 = s2 % 11; if (dv2 === 10) dv2 = 0;
    return `${n.join('')}${codUF}${dv1}${dv2}`;
}

function generate() {
    let res = "";
    if (currentType === 'cpf') res = genCPF();
    else if (currentType === 'cnpj') res = genCNPJ();
    else if (currentType === 'rg') res = genRG();
    else if (currentType === 'titulo') res = genTitulo();
    else if (currentType === 'cc') res = genCC();
    else if (currentType === 'cep') {
        const r = () => Math.floor(Math.random() * 9);
        res = `${r()}${r()}${r()}${r()}${r()}-${r()}${r()}${r()}`;
    }
    else if (currentType === 'pass') res = genPass();
    document.getElementById('main-input').value = res;
    document.getElementById('result-label').style.display = "none";
}

// --- VALIDAÇÃO ---

function validate() {
    const raw = document.getElementById('main-input').value;
    const label = document.getElementById('result-label');
    if(!raw) return;
    const clean = raw.replace(/\D/g, '');
    const rgLimpo = raw.replace(/[^0-9X]/gi, '').toUpperCase();
    let message = "", color = "";

    switch(currentType) {
        case 'rg':
            if (rgLimpo.length === 9) {
                const n = rgLimpo.substring(0, 8).split('').map(Number);
                const dvIn = rgLimpo.substring(8);
                let soma = (n[0]*2)+(n[1]*3)+(n[2]*4)+(n[3]*5)+(n[4]*6)+(n[5]*7)+(n[6]*8)+(n[7]*9);
                let resto = soma % 11;
                let dvCalc = (resto === 0) ? "0" : (resto === 10) ? "X" : (11 - resto).toString();
                if (dvCalc === dvIn) {
                    message = `✓ RG VÁLIDO (${mapaEstados[rgLimpo.substring(0,2)] || 'UF?'})`;
                    color = "#22c55e";
                } else { message = "✕ RG INVÁLIDO (Matemática Errada)"; color = "#ef4444"; }
            } else { message = "✕ FORMATO INVÁLIDO (Use 9 dígitos)"; color = "#ef4444"; }
            break;
        case 'titulo':
            if (clean.length === 12) {
                const codUF = clean.substring(8, 10);
                const uf = mapaEstados[codUF];
                message = uf ? `✓ TÍTULO VÁLIDO (${uf})` : "✕ CÓDIGO ESTADO INVÁLIDO";
                color = uf ? "#22c55e" : "#ef4444";
            } else { message = "✕ TÍTULO DEVE TER 12 DÍGITOS"; color = "#ef4444"; }
            break;
        case 'cpf':
            const v = validarCPF(clean);
            message = v ? "✓ CPF VÁLIDO" : "✕ CPF INVÁLIDO";
            color = v ? "#22c55e" : "#ef4444";
            break;
        case 'cep':
            const num = parseInt(clean);
            const busca = faixasCEP.find(f => num >= f.min && num <= f.max);
            message = busca ? `✓ CEP VÁLIDO (${busca.uf})` : "✕ CEP INEXISTENTE";
            color = busca ? "#22c55e" : "#ef4444";
            break;
        case 'pass':
            const forca = analisarSenha(raw);
            message = `SENHA ${forca.msg}`; color = forca.color;
            break;
        default:
            message = clean.length > 5 ? "✓ FORMATO VÁLIDO" : "✕ INVÁLIDO";
            color = clean.length > 5 ? "#22c55e" : "#ef4444";
    }
    label.style.display = "block"; 
    label.innerText = message; 
    label.style.color = color;
}

// --- AUXILIARES ---
function copyOrPaste() {
    const input = document.getElementById('main-input');
    const b = document.getElementById('secondary-btn');
    
    if(currentOperation === 'gen') {
        if(!input.value) return;
        input.select(); document.execCommand('copy');
        let old = b.innerText; b.innerText = "COPIADO!";
        setTimeout(() => b.innerText = old, 1200);
    } else {
        // MODO VALIDADOR: Função de Limpar
        input.value = ""; 
        document.getElementById('result-label').style.display = "none";
        input.focus();
    }
}

function validarCPF(cpf) {
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    const calc = (n, p) => {
        let s = 0; for (let i = 1; i <= n; i++) s += parseInt(cpf[i-1]) * (p - i + 1);
        let r = (s * 10) % 11; return (r === 10 || r === 11) ? 0 : r;
    };
    return calc(9, 10) === parseInt(cpf[9]) && calc(10, 11) === parseInt(cpf[10]);
}

function analisarSenha(pw) {
    if (pw.length < 6) return { msg: "CURTA", color: "#ef4444" };
    let score = 0;
    if (/[A-Z]/.test(pw)) score++; if (/[0-9]/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { msg: "FRACA ⚠️", color: "#FBBF24" };
    if (score === 2) return { msg: "MÉDIA ⚡", color: "#38BDF8" };
    return { msg: "FORTE 💪", color: "#22c55e" };
}

function genCPF() {
    const r = () => Math.floor(Math.random() * 9); 
    let n = Array.from({length: 9}, r);
    const c = (num, p) => { 
        let s = num.reduce((t, x, i) => t + (x * (p - i)), 0); 
        let res = (s * 10) % 11; return res >= 10 ? 0 : res; 
    };
    let d1 = c(n, 10), d2 = c([...n, d1], 11); 
    return `${n.join('')}${d1}${d2}`;
}

function genCNPJ() {
    const r = () => Math.floor(Math.random() * 9); 
    let n = Array.from({length: 8}, r).concat([0,0,0,1]);
    const c = (num, ps) => { 
        let s = num.reduce((t, x, i) => t + (x * ps[i]), 0); 
        let r = s % 11; return r < 2 ? 0 : 11 - r; 
    };
    let d1 = c(n, [5,4,3,2,9,8,7,6,5,4,3,2]); 
    let d2 = c([...n, d1], [6,5,4,3,2,9,8,7,6,5,4,3,2]); 
    return `${n.join('')}${d1}${d2}`;
}

function genCC() {
    const brand = document.getElementById('brand-selector').value;
    const confs = { visa: [4], master: [5, 1], amex: [3, 4], elo: [6, 3, 6, 3, 6, 8], hiper: [6, 0, 6, 2, 8, 2] };
    let n = [...confs[brand]]; 
    let len = brand === 'amex' ? 15 : 16;
    while(n.length < len - 1) n.push(Math.floor(Math.random() * 10));
    let s = 0, d = true;
    for (let i = n.length - 1; i >= 0; i--) {
        let digit = n[i];
        if (d) { digit *= 2; if (digit > 9) digit -= 9; }
        s += digit; d = !d;
    }
    n.push((10 - (s % 10)) % 10);
    return n.join('');
}

function genPass() {
    const len = parseInt(document.getElementById('pass-length-selector').value);
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    return Array.from({length: len}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}