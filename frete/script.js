// Inicia o preenchimento da barra de progresso
window.onload = function() {
    const progressBar = document.getElementById('progress');
    progressBar.style.width = '0%'; // Define a largura inicial como 0%
    
    setTimeout(function() {
        progressBar.style.transition = 'width 5s linear';
        progressBar.style.width = '100%'; // Preenche a barra até 100% em 5 segundos
    }, 100); // Pequeno atraso para garantir que a animação seja visível
};

// Função para simular o carregamento e troca de tela
setTimeout(function() {
    // Esconde a primeira seção e exibe a segunda sem delay
    document.getElementById('verification-section').classList.add('hidden');
    document.getElementById('error-section').classList.remove('hidden');

    // Exibe as caixas de informações uma abaixo da outra com delay e animação
    setTimeout(function() {
        document.getElementById('box-1').classList.remove('hidden');
    }, 0); // Sem delay para a primeira box

    setTimeout(function() {
        document.getElementById('box-2').classList.remove('hidden');
    }, 5000); // Após 5 segundos

    setTimeout(function() {
        document.getElementById('box-3').classList.remove('hidden');
        smoothScrollToBox('box-3'); // Aplica o efeito de scroll extra suave apenas para a terceira box
    }, 10000); // Após mais 5 segundos (total 10 segundos)

}, 5000); // Troca da tela de verificação para a tela de erro após 5 segundos

// Função personalizada para rolagem extra suave
function smoothScrollToBox(boxId) {
    const targetPosition = document.getElementById(boxId).getBoundingClientRect().top + window.scrollY - 50;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 2500; // Aumentei o tempo da rolagem para 1.5 segundos
    let startTime = null;

    function animationScroll(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animationScroll);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animationScroll);
}
