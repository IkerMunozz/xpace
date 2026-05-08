        // Opcional: Duplicar contenido dinámicamente si fuera necesario para tracks muy cortos
        // En este ejemplo, el HTML ya viene con el duplicado necesario para el loop visual.
        
        // Función para cambiar la velocidad dinámicamente desde consola o botones
        function setSpeed(seconds) {
            document.documentElement.style.setProperty('--marquee-speed', seconds + 's');
        }
