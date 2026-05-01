let maxZIndex = 100;

export const vDraggable = {
    mounted(el) {
        // Estilos iniciales para posicionamiento absoluto
        el.style.position = 'absolute';
        el.style.zIndex = maxZIndex;
        el.style.cursor = 'default';

        const header = el.querySelector('.card-header');
        if (!header) return;

        header.style.cursor = 'grab';

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        // Traer ventana al frente al hacer clic
        el.addEventListener('mousedown', () => {
            maxZIndex++;
            el.style.zIndex = maxZIndex;
        });

        // Iniciar arrastre desde el header
        header.addEventListener('mousedown', (e) => {
            // No arrastrar si se hizo clic en un botón dentro del header
            if (e.target.closest('button')) return;

            isDragging = true;
            header.style.cursor = 'grabbing';

            const rect = el.getBoundingClientRect();
            const parentRect = el.offsetParent ? el.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
            offsetX = e.clientX - (rect.left - parentRect.left);
            offsetY = e.clientY - (rect.top - parentRect.top);

            maxZIndex++;
            el.style.zIndex = maxZIndex;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const parentRect = el.offsetParent ? el.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            // Limitar dentro del viewport
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);

            el.style.left = newX + 'px';
            el.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
            }
        });
    }
};