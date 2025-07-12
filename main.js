
document.getElementById('statsBtn').addEventListener('click', () => {
    document.getElementById('statsModal').classList.remove('hidden');
});

document.getElementById('closeStatsBtn').addEventListener('click', () => {
    document.getElementById('statsModal').classList.add('hidden');
});

document.getElementById('refreshStatsBtn').addEventListener('click', () => {
    renderStatistics();
});



document.addEventListener('DOMContentLoaded', function () {
    // Inicializar variables
    let books = JSON.parse(localStorage.getItem('books')) || [];
    let filteredBooksGlobal = []; // aquí se guardarán los libros filtrados activamente
    let categories = JSON.parse(localStorage.getItem('customCategories')) || [];
    let currentBookId = null;
    let currentPage = 1;
    const booksPerPage = 6;

    // Función para copiar texto al portapapeles
    function copyToClipboard(text, message = "Texto copiado!") {
        navigator.clipboard.writeText(text).then(() => {
            showToast(message);
        }).catch(err => {
            console.error("Error al copiar:", err);
        });
    }

    // Manejar el evento de clic en el botón de compartir
    document.getElementById('shareToBookstagramBtn').addEventListener('click', () => {
        // Recuperar datos del libro desde el modal de detalles
        const title = document.getElementById('detailTitle').textContent;
        const author = document.getElementById('detailAuthor').textContent;
        const ratingStars = document.querySelectorAll('#detailRatingStars .star-filled').length;
        const review = document.getElementById('detailReview').textContent.trim();

        // Generar plantilla de reseña
        const template = `
📚 Libro: ${title}
🖋️ Autor: ${author}
⭐ Puntuación: ${ratingStars} estrellas
📝 Reseña: "${review}"

#bookstagram #libros #lectura #bookrecommendation #readingtime
`.trim();

        // Copiar el texto al portapapeles
        copyToClipboard(template, "Plantilla de reseña copiada para la descripción de Instagram/TikTok");
    });

    // Función para exportar detalles del libro como PDF
    document.getElementById('exportToPdfBtn').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Recuperar datos del libro
        const title = document.getElementById('detailTitle').textContent;
        const author = document.getElementById('detailAuthor').textContent;
        const category = document.getElementById('detailCategory').textContent;
        const rating = document.getElementById('detailRatingValue').textContent;
        const review = document.getElementById('detailReview').textContent.trim();
        const estado = document.getElementById('detailEstado').textContent;
        const startDate = document.getElementById('detailStartDate').textContent;
        const endDate = document.getElementById('detailEndDate').textContent;

        let y = 20;

        // Portada simulada
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text("Reseña de Libro", 105, y, null, null, 'center');
        y += 10;
        doc.setDrawColor(0);
        doc.line(20, y, 190, y);
        y += 10;

        // Datos principales
        doc.setFontSize(16);
        doc.text(`Título: ${title}`, 20, y);
        y += 10;
        doc.text(`Autor: ${author}`, 20, y);
        y += 10;
        doc.text(`Género: ${category}`, 20, y);
        y += 10;
        doc.text(`Formato: ${document.getElementById('detailFormat').textContent}`, 20, y);
        y += 10;
        doc.text(`Estado: ${estado}`, 20, y);
        y += 10;
        doc.text(`Fecha Inicio: ${startDate}`, 20, y);
        y += 10;
        doc.text(`Fecha Fin: ${endDate}`, 20, y);
        y += 10;
        doc.text(`Puntuación: ${rating}`, 20, y);
        y += 10;
        doc.text(`Páginas: ${document.getElementById('detailPages').textContent}`, 20, y);
        y += 15;

        // Reseña
        doc.setFontSize(14);
        doc.text("Reseña:", 20, y);
        y += 10;
        doc.setFontSize(12);
        const reviewLines = doc.splitTextToSize(review, 170);
        doc.text(reviewLines, 20, y);
        y += reviewLines.length * 7 + 10;

        // Notas
        const notes = document.getElementById('detailDescription').textContent.trim();
        if (notes && notes !== "Sin notas") {
            doc.setFontSize(14);
            doc.text("Notas:", 20, y);
            y += 10;
            const notesLines = doc.splitTextToSize(notes, 170);
            doc.text(notesLines, 20, y);
        }

        // Guardar el PDF
        doc.save(`${title.replace(/\s+/g, '_')}_reseña.pdf`);
    });

    // Función para codificar libro(s) en base64 y crear un hash compartible
    function generateShareLink(bookIds) {
        const booksToShare = books.filter(book => bookIds.includes(book.id));
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(booksToShare))));
        return `${window.location.origin}${window.location.pathname}#books=${encoded}`;
    }

    // Manejador del botón "Compartir Libro"
    document.getElementById('shareBookBtn').addEventListener('click', () => {
        const currentBookId = document.getElementById('detailTitle').dataset.bookId;
        if (!currentBookId) {
            showToast("No hay ningún libro seleccionado.");
            return;
        }

        const shareLink = generateShareLink([currentBookId]);

        navigator.clipboard.writeText(shareLink).then(() => {
            showToast("Enlace copiado al portapapeles. ¡Compártelo!");
        }).catch(err => {
            console.error("Error al copiar:", err);
            prompt("Copia el enlace manualmente", shareLink);
        });
    });

    // Cargar libros desde el hash URL si existe
    window.addEventListener('load', () => {
        const hash = window.location.hash;

        if (hash.startsWith('#books=')) {
            try {
                const encodedData = hash.replace('#books=', '');
                const decoded = decodeURIComponent(escape(atob(encodedData)));
                const sharedBooks = JSON.parse(decoded);

                // Mostrar solo esos libros en lugar de toda la biblioteca
                books = sharedBooks;

                // Actualizar interfaz
                renderBooks();
                showToast("Mostrando libros compartidos");
            } catch (e) {
                console.error("Error al leer los libros compartidos:", e);
            }
        }
    });

    // Si hay libros compartidos en el hash, cargarlos
    const hash = window.location.hash;
    if (hash.startsWith('#books=')) {
        try {
            const encodedData = hash.replace('#books=', '');
            const decoded = decodeURIComponent(escape(atob(encodedData)));
            const sharedBooks = JSON.parse(decoded);

            // Mostrar los libros aunque no se guarden
            books = sharedBooks;
            filteredBooksGlobal = books;
            filteredBooksGlobal.isFiltered = false;
            currentPage = 1;
            updateLibraryView();
            showToast("📖 Vista previa de libros compartidos");

            // Preguntar si se desea guardar
            if (confirm("¿Quieres guardar los libros compartidos en tu biblioteca?")) {
                const existingBooks = JSON.parse(localStorage.getItem('books')) || [];
                const existingIds = new Set(existingBooks.map(b => b.id));
                const newBooks = sharedBooks.filter(b => !existingIds.has(b.id));

                const combinedBooks = [...existingBooks, ...newBooks];
                localStorage.setItem('books', JSON.stringify(combinedBooks));

                // Actualizar variables
                books = combinedBooks;
                filteredBooksGlobal = books;
                filteredBooksGlobal.isFiltered = false;
                currentPage = 1;
                updateLibraryView();

                showToast(`✅ ${newBooks.length} libro(s) añadido(s) a tu biblioteca`);
            }

            // Limpiar el hash de la URL
            history.replaceState(null, '', window.location.pathname);

        } catch (e) {
            console.error("❌ Error al leer los libros compartidos:", e);
            showToast("❌ Error al cargar libros desde el enlace");
        }
    }

    // Referencias a elementos DOM
    const bookshelf = document.getElementById('bookshelf');
    const emptyLibrary = document.getElementById('emptyLibrary');
    const bookModal = document.getElementById('bookModal');
    const categoryModal = document.getElementById('categoryModal');
    const detailModal = document.getElementById('detailModal');
    const confirmModal = document.getElementById('confirmModal');
    const bookForm = document.getElementById('bookForm');
    const categoryForm = document.getElementById('categoryForm');
    const modalTitle = document.getElementById('modalTitle');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const filterFormat = document.getElementById('filterFormat');
    const filterEstado = document.getElementById('filterEstado');
    const categorySelect = document.getElementById('category');
    const sortBooks = document.getElementById('sortBooks');
    const pages = document.getElementById('pages').value;


    // Botones
    const addBookBtn = document.getElementById('addBookBtn');
    const clearOutfilterBtn = document.getElementById('clearOutfilterBtn');
    const emptyAddBookBtn = document.getElementById('emptyAddBookBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    const editBookBtn = document.getElementById('editBookBtn');
    const deleteBookBtn = document.getElementById('deleteBookBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Selectores de color
    const colorSelectors = document.querySelectorAll('[data-color]');

    // Selectores de tema
    const themeAmber = document.getElementById('themeAmber');
    const themeDark = document.getElementById('themeDark');
    const themeCustom = document.getElementById('themeCustom');

    // Estrellas de puntuación
    const ratingStars = document.querySelectorAll('.star');

    // Inicializar la biblioteca
    updateLibraryView();
    updateCategoryOptions();
    document.getElementById('clearOutfilterBtn').addEventListener('click', () => {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterEstado').value = '';
        document.getElementById('filterFormat').value = '';
        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        document.getElementById('searchInput').value = '';

        filteredBooksGlobal = [];
        filteredBooksGlobal.isFiltered = false; // 🧹 Marcamos que ya no hay filtro
        currentPage = 1;
        filterBooks(); // 🔁 Forzar re-filtrado sin filtros
    });

    //Géneros para Estadísticas
    function updateStatsCategoryOptions() {
        const statsCategorySelect = document.getElementById('statsCategory');
        const defaultCategories = ['Novela', 'Ciencia Ficción', 'Fantasía', 'Historia', 'Biografía', 'Autoayuda'];

        let categoryOptions = `<option value="">Todos</option>`;

        defaultCategories.forEach(cat => {
            categoryOptions += `<option value="${cat}">${cat}</option>`;
        });

        categories.forEach(cat => {
            categoryOptions += `<option value="${cat}">${cat}</option>`;
        });

        statsCategorySelect.innerHTML = categoryOptions;
    }

    function updateStatsYearOptions() {
        const statsYearSelect = document.getElementById('statsYear');
        const currentYear = new Date().getFullYear();
        const years = new Set();

        // Recoger años de libros con endDate válido
        books.forEach(book => {
            if (book.endDate) {
                const parsedYear = new Date(book.endDate).getFullYear();
                if (!isNaN(parsedYear)) {
                    years.add(parsedYear);
                }
            }
        });

        // Asegurar que el año actual SIEMPRE aparece
        years.add(currentYear);

        const sortedYears = Array.from(years).sort((a, b) => b - a);

        let options = '';
        sortedYears.forEach(year => {
            options += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
        });

        statsYearSelect.innerHTML = options;
    }


    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'theme-amber';
    document.body.className = savedTheme;
    updateThemeButtons(savedTheme);

    // Event Listeners
    emptyAddBookBtn.addEventListener('click', openAddBookModal);
    cancelBtn.addEventListener('click', closeBookModal);
    bookForm.addEventListener('submit', saveBook);
    addCategoryBtn.addEventListener('click', openCategoryModal);
    cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    categoryForm.addEventListener('submit', saveCategory);
    closeDetailBtn.addEventListener('click', closeDetailModal);
    editBookBtn.addEventListener('click', editCurrentBook);
    deleteBookBtn.addEventListener('click', openConfirmDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeConfirmModal);
    confirmDeleteBtn.addEventListener('click', deleteCurrentBook);
    searchInput.addEventListener('input', filterBooks);
    filterCategory.addEventListener('change', filterBooks);
    filterFormat.addEventListener('change', filterBooks);
    filterEstado.addEventListener('change', filterBooks);
    sortBooks.addEventListener('change', filterBooks);
    addBookBtn.addEventListener('click', openAddBookModal);
    document.getElementById('filterStartDate').addEventListener('change', filterBooks);
    document.getElementById('filterEndDate').addEventListener('change', filterBooks);


    // Botón de Estadísticas
    const statsBtn = document.getElementById('statsBtn');
    const statsModal = document.getElementById('statsModal');
    const closeStatsBtn = document.getElementById('closeStatsBtn');
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');

    // Abrir el modal de estadísticas
    statsBtn.addEventListener('click', () => {
        updateStatsCategoryOptions();
        updateStatsYearOptions();
        statsModal.classList.remove('hidden');
    });
    statsBtn.addEventListener('click', () => {
        statsModal.classList.remove('hidden');
    });

    // Cerrar el modal de estadísticas
    closeStatsBtn.addEventListener('click', () => {
        statsModal.classList.add('hidden');
    });

    // Refrescar estadísticas al pulsar el botón
    refreshStatsBtn.addEventListener('click', () => {
        renderStatistics();
    });

    function renderStatistics() {
        // Aquí luego haremos todos los cálculos cuando me digas "Funciona"
        const statsContent = document.getElementById('statsContent');
        statsContent.innerHTML = '';

        // Obtener filtros
        const startDate = document.getElementById('statsStartDate').value;
        const endDate = document.getElementById('statsEndDate').value;
        const selectedCategory = document.getElementById('statsCategory').value;

        // Filtrar libros
        let filteredBooks = books.filter(book => book.terminado === "Terminado");

        if (startDate) {
            filteredBooks = filteredBooks.filter(book => book.endDate && new Date(book.endDate) >= new Date(startDate));
        }

        if (endDate) {
            filteredBooks = filteredBooks.filter(book => book.endDate && new Date(book.endDate) <= new Date(endDate));
        }

        if (selectedCategory) {
            filteredBooks = filteredBooks.filter(book => book.category === selectedCategory);
        }

        // Si no hay libros en el rango, usamos toda la biblioteca pero siempre solo libros Terminados
        if (filteredBooks.length === 0) {

        }

        // Contador total de libros leídos
        const totalLibrosLeidos = filteredBooks.length;

        // Total de páginas leídas
        const totalPaginasLeidas = filteredBooks.reduce((sum, book) => {
            return sum + (parseInt(book.pages) || 0);
        }, 0);

        // Actualizar el contenido del modal
        statsContent.innerHTML += `
                        <div class="h-px bg-gray-300 my-4"></div>
                        <h4 class="text-xl font-bold text-gray-800">📚 Total de libros leídos: ${totalLibrosLeidos}</h4>
                        <div class="h-px bg-gray-300 my-4"></div>
                        <h4 class="text-xl font-bold text-gray-800">📄 Total de páginas leídas: ${totalPaginasLeidas}</h4>
                        <div class="h-px bg-gray-300 my-4"></div>
                    `;

        // Promedio general de rating
        const librosConRating = filteredBooks.filter(book => book.rating && !isNaN(parseFloat(book.rating)));
        let averageRatingHtml = '';

        if (librosConRating.length > 0) {
            const totalRating = librosConRating.reduce((sum, book) => sum + parseFloat(book.rating), 0);
            const averageRating = totalRating / librosConRating.length;

            averageRatingHtml = `
                                <h4 class="text-xl font-bold text-gray-800">⭐ Promedio general de rating: ${averageRating.toFixed(2)}</h4>
                                <div class="h-px bg-gray-300 my-4"></div>
                            `;
        } else {
            averageRatingHtml = `
                                <h4 class="text-xl font-bold text-gray-800">⭐ Promedio general de rating: Sin valoraciones disponibles</h4>
                                <div class="h-px bg-gray-300 my-4"></div>
                            `;
        }


        statsContent.innerHTML += averageRatingHtml;

        // Promedio general de páginas
        let librosParaPromedioPaginas = books.slice(); // Empezamos con todos los libros


        // Aplicamos los mismos filtros que en otras secciones
        if (startDate) {
            librosParaPromedioPaginas = librosParaPromedioPaginas.filter(book =>
                book.endDate ? new Date(book.endDate) >= new Date(startDate) : false
            );
        }

        if (endDate) {
            librosParaPromedioPaginas = librosParaPromedioPaginas.filter(book =>
                book.endDate ? new Date(book.endDate) <= new Date(endDate) : false
            );
        }

        if (selectedCategory) {
            librosParaPromedioPaginas = librosParaPromedioPaginas.filter(book =>
                book.category === selectedCategory
            );
        }

        // Filtrar libros con páginas válidas
        const librosConPaginasValidas = librosParaPromedioPaginas.filter(book =>
            book.pages && !isNaN(parseFloat(book.pages)) && book.terminado === "Terminado"
        );

        let averagePagesHtml = '';

        if (librosConPaginasValidas.length > 0) {
            const totalPaginas = librosConPaginasValidas.reduce((sum, book) =>
                sum + parseFloat(book.pages), 0
            );
            const averagePaginas = totalPaginas / librosConPaginasValidas.length;

            averagePagesHtml = `
                            <h4 class="text-xl font-bold text-gray-800">📄 Promedio de Páginas por Libro: ${averagePaginas.toFixed(2)}</h4>
                            <div class="h-px bg-gray-300 my-4"></div>
                        `;
        } else {
            averagePagesHtml = `
                            <h4 class="text-xl font-bold text-gray-800">📄 Promedio de Páginas por Libro: Sin páginas disponibles</h4>
                            <div class="h-px bg-gray-300 my-4"></div>
                        `;
        }

        statsContent.innerHTML += averagePagesHtml;

        if (selectedCategory === "") {
            // Contar libros por categoría
            const genreStats = {};

            filteredBooks.forEach(book => {
                const genre = book.category || 'Sin género';
                if (!genreStats[genre]) {
                    genreStats[genre] = { count: 0, pages: 0, totalRating: 0, ratingCount: 0 };
                }
                genreStats[genre].count++;
                genreStats[genre].pages += parseInt(book.pages) || 0;
                genreStats[genre].totalRating += parseFloat(book.rating) || 0;
                genreStats[genre].ratingCount += book.rating ? 1 : 0;
            });

            // Convertir en array
            let genreArray = Object.entries(genreStats).map(([genre, data]) => {
                const avgRating = data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0;
                return { genre, ...data, avgRating };
            });

            // Orden por reglas: más libros > más páginas > mejor rating
            genreArray.sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                if (b.pages !== a.pages) return b.pages - a.pages;
                return b.avgRating - a.avgRating;
            });

            // Coger solo el top 3
            genreArray = genreArray.slice(0, 3);

            // Orden estilo Top 3 (2°, 1°, 3°)
            if (genreArray.length === 3) {
                genreArray = [genreArray[1], genreArray[0], genreArray[2]];
            } else if (genreArray.length === 2) {
                genreArray = [genreArray[1], genreArray[0]];
            }

            if (genreStats.length === 0) {
            }

            // Crear gráfico de barras (usando simple HTML)
            let genreChartHtml = `
                                <h4 class="text-xl font-bold text-gray-800">🏆 Top 3 géneros más leídos</h4>
                                <div class="space-y-2">
                            `;
            const topOrderGenres = ["2º", "1º", "3º"];
            genreArray.forEach((g, index) => {
                const positionText = topOrderGenres[index] || `${index + 1}º`;
                genreChartHtml += `
                                    <div>
                                        <span class="font-semibold">${positionText} - ${g.genre} (${g.count} libros, ${g.pages} páginas, ⭐${g.avgRating.toFixed(2)})</span>
                                        <div class="bg-accent-light h-4 rounded" style="width: ${Math.min(g.count * 20, 100)}%;"></div>
                                    </div>
                                `;
            });

            genreChartHtml += `
                                </div>
                                <p class="text-xs text-gray-500 mt-1">Orden: más libros > más páginas > mejor rating</p>
                                <div class="h-px bg-gray-300 my-4"></div>
                            `;

            // Añadirlo al contenido

            statsContent.innerHTML += genreChartHtml;

        }
        // Filtrar solo por fecha y categoría, pero SIN filtrar por terminado
        let authorFilteredBooks = books.slice(); // Copia de todos los libros

        if (startDate) {
            authorFilteredBooks = authorFilteredBooks.filter(book => book.endDate && new Date(book.endDate) >= new Date(startDate));
        }

        if (endDate) {
            authorFilteredBooks = authorFilteredBooks.filter(book => book.endDate && new Date(book.endDate) <= new Date(endDate));
        }

        if (selectedCategory) {
            authorFilteredBooks = authorFilteredBooks.filter(book => book.category === selectedCategory);
        }

        // Si no hay libros en el rango, usamos todos
        if (authorFilteredBooks.length === 0) {
        }

        // Contar libros por autor
        const authorStats = {};

        authorFilteredBooks.forEach(book => {
            const author = book.author || 'Autor desconocido';
            if (!authorStats[author]) {
                authorStats[author] = { count: 0, pages: 0, totalRating: 0, ratingCount: 0 };
            }
            authorStats[author].count++;
            authorStats[author].pages += parseInt(book.pages) || 0;
            authorStats[author].totalRating += parseFloat(book.rating) || 0;
            authorStats[author].ratingCount += book.rating ? 1 : 0;
        });

        // Convertir en array
        let authorArray = Object.entries(authorStats).map(([author, data]) => {
            const avgRating = data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0;
            return { author, ...data, avgRating };
        });

        // Orden por reglas: más libros > más páginas > mejor rating
        authorArray.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            if (b.pages !== a.pages) return b.pages - a.pages;
            return b.avgRating - a.avgRating;
        });

        // Coger solo el top 3
        authorArray = authorArray.slice(0, 3);

        // Orden estilo Top 3 (2°, 1°, 3°)
        if (authorArray.length === 3) {
            authorArray = [authorArray[1], authorArray[0], authorArray[2]];
        } else if (authorArray.length === 2) {
            authorArray = [authorArray[1], authorArray[0]];
        }

        // Crear gráfico de barras para autores
        let authorChartHtml = `
                            <h4 class="text-xl font-bold text-gray-800">🖋️ Top 3 autores más leídos</h4>
                            <div class="space-y-2">
                            
                        `;
        const topOrder = ["2º", "1º", "3º"];
        authorArray.forEach((a, index) => {
            const positionText = topOrder[index] || `${index + 1}º`;
            authorChartHtml += `
                                <div>
                                    <span class="font-semibold">${positionText} - ${a.author} (${a.count} libros, ${a.pages} páginas, ⭐${a.avgRating.toFixed(2)})</span>
                                    <div class="bg-accent-light h-4 rounded" style="width: ${Math.min(a.count * 20, 100)}%;"></div>
                                    
                                </div>
                            `;
        });
        authorChartHtml += `
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Orden: más libros > más páginas > mejor rating</p>
                            <div class="h-px bg-gray-300 my-4"></div>
                        `;

        statsContent.innerHTML += authorChartHtml;


        // Libros Iniciados vs Terminados (sin filtrar por 'terminado', pero sí por fecha y categoría)
        let estadoFilteredBooks = books.slice();

        if (startDate) {
            estadoFilteredBooks = estadoFilteredBooks.filter(book => book.endDate && new Date(book.endDate) >= new Date(startDate));
        }

        if (endDate) {
            estadoFilteredBooks = estadoFilteredBooks.filter(book => book.endDate && new Date(book.endDate) <= new Date(endDate));
        }

        if (selectedCategory) {
            estadoFilteredBooks = estadoFilteredBooks.filter(book => book.category === selectedCategory);
        }

        // Si no hay libros en el rango, usar todos
        if (estadoFilteredBooks.length === 0) {
        }

        const iniciadosCount = estadoFilteredBooks.filter(book => book.terminado === "Empezado").length;
        const terminadosCount = estadoFilteredBooks.filter(book => book.terminado === "Terminado").length;

        let estadoChartHtml = `
                            <h4 class="text-xl font-bold text-gray-800">📖 Libros Iniciados vs Terminados</h4>
                            <div class="space-y-2">
                                <div>
                                    <span class="font-semibold">Por terminar: ${iniciadosCount}</span>
                                    <div class="bg-blue-400 h-4 rounded" style="width: ${Math.min(iniciadosCount * 20, 100)}%;"></div>
                                </div>
                                <div>
                                    <span class="font-semibold">Terminados: ${terminadosCount}</span>
                                    <div class="bg-green-500 h-4 rounded" style="width: ${Math.min(terminadosCount * 20, 100)}%;"></div>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Filtro por fechas y género activo, pero sin condición de estado.</p>
                            <div class="h-px bg-gray-300 my-4"></div>
                        `;

        statsContent.innerHTML += estadoChartHtml;
        // Top 3 Formatos más leídos (sin condición de terminado)
        let formatoFilteredBooks = books.slice();

        if (startDate) {
            formatoFilteredBooks = formatoFilteredBooks.filter(book => book.endDate && new Date(book.endDate) >= new Date(startDate));
        }

        if (endDate) {
            formatoFilteredBooks = formatoFilteredBooks.filter(book => book.endDate && new Date(book.endDate) <= new Date(endDate));
        }

        if (selectedCategory) {
            formatoFilteredBooks = formatoFilteredBooks.filter(book => book.category === selectedCategory);
        }

        // Si no hay libros en el rango, usar todos
        if (formatoFilteredBooks.length === 0) {
        }

        // Contar por formato
        const formatoStats = {};

        formatoFilteredBooks.forEach(book => {
            const formato = book.format || 'Formato desconocido';
            if (!formatoStats[formato]) {
                formatoStats[formato] = { count: 0, pages: 0, totalRating: 0, ratingCount: 0 };
            }
            formatoStats[formato].count++;
            formatoStats[formato].pages += parseInt(book.pages) || 0;
            formatoStats[formato].totalRating += parseFloat(book.rating) || 0;
            formatoStats[formato].ratingCount += book.rating ? 1 : 0;
        });

        // Convertir en array
        let formatoArray = Object.entries(formatoStats).map(([formato, data]) => {
            const avgRating = data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0;
            return { formato, ...data, avgRating };
        });

        // Ordenar: más libros > más páginas > mejor rating
        formatoArray.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            if (b.pages !== a.pages) return b.pages - a.pages;
            return b.avgRating - a.avgRating;
        });

        // Coger solo el Top 3
        formatoArray = formatoArray.slice(0, 3);

        // Reordenar al estilo Top 3 visual: 2°, 1°, 3°
        if (formatoArray.length === 3) {
            formatoArray = [formatoArray[1], formatoArray[0], formatoArray[2]];
        } else if (formatoArray.length === 2) {
            formatoArray = [formatoArray[1], formatoArray[0]];
        }

        // Renderizar el gráfico de formatos
        const topOrderFormatos = ["2º", "1º", "3º"];
        let formatoChartHtml = `
                            <h4 class="text-xl font-bold text-gray-800">📱 Top 3 formatos más leídos</h4>
                            <div class="space-y-2">
                        `;

        formatoArray.forEach((f, index) => {
            const positionText = topOrderFormatos[index] || `${index + 1}º`;
            formatoChartHtml += `
                                <div>
                                    <span class="font-semibold">${positionText} - ${f.formato} (${f.count} libros, ${f.pages} páginas, ⭐${f.avgRating.toFixed(2)})</span>
                                    <div class="bg-purple-400 h-4 rounded" style="width: ${Math.min(f.count * 20, 100)}%;"></div>
                                </div>
                            `;
        });

        formatoChartHtml += `
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Orden: más libros > más páginas > mejor rating</p>
                            <div class="h-px bg-gray-300 my-4"></div>
                        `;

        statsContent.innerHTML += formatoChartHtml;

        // Top 3 de Estados (sin condición de terminado)
        let estadoFilteredBooksTop = books.slice();

        if (startDate) {
            estadoFilteredBooksTop = estadoFilteredBooksTop.filter(book => book.endDate && new Date(book.endDate) >= new Date(startDate));
        }

        if (endDate) {
            estadoFilteredBooksTop = estadoFilteredBooksTop.filter(book => book.endDate && new Date(book.endDate) <= new Date(endDate));
        }

        if (selectedCategory) {
            estadoFilteredBooksTop = estadoFilteredBooksTop.filter(book => book.category === selectedCategory);
        }

        // Si no hay libros en el rango, usar todos
        if (estadoFilteredBooksTop.length === 0) {
        }

        // Contar por estado
        const estadoStats = {};

        estadoFilteredBooksTop.forEach(book => {
            const estado = book.terminado || 'Estado desconocido';
            if (!estadoStats[estado]) {
                estadoStats[estado] = { count: 0, pages: 0, totalRating: 0, ratingCount: 0 };
            }
            estadoStats[estado].count++;
            estadoStats[estado].pages += parseInt(book.pages) || 0;
            estadoStats[estado].totalRating += parseFloat(book.rating) || 0;
            estadoStats[estado].ratingCount += book.rating ? 1 : 0;
        });

        // Convertir en array
        let estadoArray = Object.entries(estadoStats).map(([estado, data]) => {
            const avgRating = data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0;
            return { estado, ...data, avgRating };
        });

        // Ordenar: más libros > más páginas > mejor rating
        estadoArray.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            if (b.pages !== a.pages) return b.pages - a.pages;
            return b.avgRating - a.avgRating;
        });

        // Coger solo el Top 3
        estadoArray = estadoArray.slice(0, 3);

        // Reordenar visualmente al estilo Top 3 (2°, 1°, 3°)
        if (estadoArray.length === 3) {
            estadoArray = [estadoArray[0], estadoArray[1], estadoArray[2]];
        } else if (estadoArray.length === 2) {
            estadoArray = [estadoArray[1], estadoArray[0]];
        }

        // Renderizar el gráfico de estados
        const topOrderEstados = ["1º", "2º", "3º"];
        let estado2ChartHtml = `
                            <h4 class="text-xl font-bold text-gray-800">📊 El Estado de tu Biblioteca</h4>
                            <div class="space-y-2">
                        `;

        const totalLibrosEstados = estadoArray.reduce((a, e) => a + e.count, 0);
        estadoArray.forEach((e, index) => {
            const positionText = topOrderEstados[index] || `${index + 1}º`;
            const porcentajeEstado = totalLibrosEstados > 0 ? ((e.count / totalLibrosEstados) * 100).toFixed(1) : 0;
            estado2ChartHtml += `
                                <div>
                                    <span class="font-semibold">${positionText} - ${e.estado}: ${e.count} libros (${porcentajeEstado}%), ${e.pages} páginas, ⭐${e.avgRating.toFixed(2)}</span>
                                    <div class="bg-yellow-400 h-4 rounded" style="width: ${Math.min(e.count * 20, 100)}%;"></div>
                                </div>
                                
                            `;
        });

        estado2ChartHtml += `
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Orden: más libros > más páginas > mejor rating</p>
                            <div class="h-px bg-gray-300 my-4"></div>
                        `;

        statsContent.innerHTML += estado2ChartHtml;

        // Tendencia mensual de libros leídos (solo terminados)
        const selectedYear = document.getElementById('statsYear').value;

        let tendenciaBooks = books.filter(book => book.terminado === "Terminado");

        // Si hay filtros de fecha, aplicarlos
        if (startDate) {
            tendenciaBooks = tendenciaBooks.filter(book => book.endDate && new Date(book.endDate) >= new Date(startDate));
        }

        if (endDate) {
            tendenciaBooks = tendenciaBooks.filter(book => book.endDate && new Date(book.endDate) <= new Date(endDate));
        }

        if (selectedCategory) {
            tendenciaBooks = tendenciaBooks.filter(book =>
                book.category === selectedCategory
            );
        }

        // Si no hay libros en el rango, usar todos
        if (tendenciaBooks.length === 0) {
        }

        // Si no hay filtros de fecha, usamos el año seleccionado
        if (!startDate && !endDate) {
            tendenciaBooks = tendenciaBooks.filter(book => {
                return book.endDate && new Date(book.endDate).getFullYear().toString() === selectedYear;
            });
        }

        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const librosPorMes = Array(12).fill(0);

        tendenciaBooks.forEach(book => {
            if (book.endDate) {
                const fecha = new Date(book.endDate);
                if (fecha.getFullYear().toString() === selectedYear || (startDate || endDate)) {
                    librosPorMes[fecha.getMonth()]++;
                }
            }
        });

        // Renderizar gráfico simple de líneas (HTML básico)
        let tendenciaHtml = `
                            <h4 class="text-xl font-bold text-gray-800">📈 Tendencia mensual de libros leídos (${selectedYear})</h4>
                            <div class="space-y-1">
                        `;

        const totalLibrosAnuales = librosPorMes.reduce((a, b) => a + b, 0);

        librosPorMes.forEach((count, index) => {
            const porcentajeReal = totalLibrosAnuales > 0 ? ((count / totalLibrosAnuales) * 100).toFixed(1) : 0;
            const porcentajeBarra = Math.min(count * 20, 100);
            tendenciaHtml += `
                                <div>
                                    <span>${meses[index]}: ${count} libros (${porcentajeReal}%)</span>
                                    <div class="bg-indigo-500 h-2 rounded" style="width: ${porcentajeBarra}%;"></div>
                                </div>
                            `;
        });

        tendenciaHtml += `
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Filtro de fechas y género activo si está seleccionado. Si no, se usa el año elegido.</p>
                            <div class="h-px bg-gray-300 my-4"></div>
                        `;

        statsContent.innerHTML += tendenciaHtml;



    }



    // Event listeners para selectores de color
    colorSelectors.forEach(selector => {
        selector.addEventListener('click', function () {
            // Quitar selección anterior
            colorSelectors.forEach(s => s.classList.remove('ring-2', 'ring-offset-2'));
            // Añadir selección al color actual
            this.classList.add('ring-2', 'ring-offset-2');
            // Guardar el color seleccionado
        });
    });

    // Event listeners para temas
    themeAmber.addEventListener('click', () => changeTheme('theme-amber'));
    themeDark.addEventListener('click', () => changeTheme('theme-dark'));
    themeCustom.addEventListener('click', () => changeTheme('theme-custom'));

    // Event listeners para estrellas de puntuación
    ratingStars.forEach(star => {
        star.addEventListener('click', function () {
            const value = parseInt(this.getAttribute('data-value'));
            document.getElementById('rating').value = value;
            document.getElementById('ratingValue').textContent = value + '/5';
            updateStars(value);
        });

        star.addEventListener('mouseover', function () {
            const value = parseInt(this.getAttribute('data-value'));
            highlightStars(value);
        });

        star.addEventListener('mouseout', function () {
            const currentRating = parseInt(document.getElementById('rating').value);
            highlightStars(currentRating);
        });
    });

    // Funciones

    function formatDateToDisplay(dateString) {
        if (!dateString) return 'No especificado';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function updateLibraryView() {
        console.log('searchInput:', searchInput);
        console.log('filterCategory:', filterCategory);
        const isFiltered = filteredBooksGlobal.isFiltered;
        const booksToRender = isFiltered ? filteredBooksGlobal : books;

        if (booksToRender.length === 0) {
            emptyLibrary.classList.remove('hidden');
            bookshelf.classList.add('hidden');
            document.getElementById('paginationControls')?.remove();
            return;
        }

        emptyLibrary.classList.add('hidden');
        bookshelf.classList.remove('hidden');

        const startIndex = (currentPage - 1) * booksPerPage;
        const paginatedBooks = booksToRender.slice(startIndex, startIndex + booksPerPage);

        renderBooks(paginatedBooks);
        renderPaginationControls(booksToRender.length);
    }

    function renderPaginationControls(totalBooks) {
        const totalPages = Math.ceil(totalBooks / booksPerPage);
        let paginationContainer = document.getElementById('paginationControls');

        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'paginationControls';
            paginationContainer.className = 'flex justify-center mt-6 flex-wrap gap-2';
            bookshelf.parentElement.appendChild(paginationContainer);
        }

        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const maxPagesToShow = 5;
        const pageButtons = [];

        const createButton = (label, page, disabled = false, isActive = false) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.disabled = disabled;
            btn.className = `px-3 py-1 rounded-lg font-medium transition ${isActive
                ? 'bg-accent text-white ring-2 ring-accent'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
            if (!disabled) {
                btn.addEventListener('click', () => {
                    currentPage = page;
                    updateLibraryView();
                });
            }
            return btn;
        };

        // Botón Inicio y Anterior
        paginationContainer.appendChild(createButton('«', 1, currentPage === 1));
        paginationContainer.appendChild(createButton('‹', currentPage - 1, currentPage === 1));

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, currentPage + 2);

        // Ajustes cuando estás cerca del inicio o del final
        if (currentPage <= 3) {
            end = Math.min(totalPages, 5);
        } else if (currentPage >= totalPages - 2) {
            start = Math.max(1, totalPages - 4);
        }

        // Primeros puntos suspensivos
        if (start > 1) {
            paginationContainer.appendChild(createButton('1', 1));
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'px-2';
            paginationContainer.appendChild(dots);
        }

        // Números de página visibles
        for (let i = start; i <= end; i++) {
            paginationContainer.appendChild(createButton(i, i, false, i === currentPage));
        }

        // Últimos puntos suspensivos
        if (end < totalPages) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'px-2';
            paginationContainer.appendChild(dots);
            paginationContainer.appendChild(createButton(totalPages, totalPages));
        }

        // Botón Siguiente y Fin
        paginationContainer.appendChild(createButton('›', currentPage + 1, currentPage === totalPages));
        paginationContainer.appendChild(createButton('»', totalPages, currentPage === totalPages));
    }


    function createPaginationContainer() {
        const container = document.createElement('div');
        container.id = 'paginationControls';
        container.className = 'flex justify-center mt-6';
        bookshelf.parentElement.appendChild(container);
        return container;
    }

    function updateCategoryOptions() {
        // Actualizar opciones en el selector de categorías del formulario
        const defaultCategories = ['Novela', 'Ciencia Ficción', 'Fantasía', 'Historia', 'Biografía', 'Autoayuda'];

        // Actualizar el selector de categorías en el formulario
        let categoryOptions = `<option value="">Selecciona un género</option>`;
        defaultCategories.forEach(cat => {
            categoryOptions += `<option value="${cat}">${cat}</option>`;
        });

        categories.forEach(cat => {
            categoryOptions += `<option value="${cat}">${cat}</option>`;
        });

        categorySelect.innerHTML = categoryOptions;

        // Actualizar el selector de filtro de categorías
        let filterOptions = `<option value="">Todos los géneros</option>`;
        defaultCategories.forEach(cat => {
            filterOptions += `<option value="${cat}">${cat}</option>`;
        });

        categories.forEach(cat => {
            filterOptions += `<option value="${cat}">${cat}</option>`;
        });

        filterCategory.innerHTML = filterOptions;
    }


    function renderBooks(booksToRender) {
        bookshelf.innerHTML = '';

        booksToRender.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card bg-white rounded-lg shadow-md overflow-hidden';


            // Crear estrellas para la puntuación
            let starsHtml = '';
            const rating = book.rating || 0;
            for (let i = 1; i <= 5; i++) {
                const starClass = i <= rating ? 'star-filled' : 'star-empty';
                starsHtml += `<span class="star ${starClass}">★</span>`;
            }

            bookCard.innerHTML = `
                        <div class="p-5">
                            <h3 class="text-lg font-bold mb-1 truncate">${book.title}</h3>
                            <p class="text-gray-600 mb-2">${book.author}</p>
                            <div class="flex justify-between items-center mb-2">
                                <span class="bg-accent-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded">${book.category}</span>
                                <span class="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded">${book.format || 'No especificado'}</span>
                            </div>
                            <div class="flex items-center mb-3">
                                <span class="ml-1 text-xs text-gray-500">Páginas: ${book.pages} | </span>
                                
                                <span class="ml-1 text-xs text-gray-500">Estado: ${book.terminado}</span>
                            </div>
                            <div class="flex items-center mb-3">
                                <div class="flex text-sm">
                                    ${starsHtml}
                                </div>
                                <span class="ml-1 text-xs text-gray-500">(${rating}/5)</span>
                            </div>
                            <button class="view-book-btn w-full bg-accent hover-primary-light text-on-primary text-sm font-semibold py-1.5 px-3 rounded-lg transition duration-300" data-id="${book.id}">
                                Ver detalles
                            </button>
                        </div>
                    `;

            bookshelf.appendChild(bookCard);

            // Añadir event listener al botón de ver detalles
            const viewBtn = bookCard.querySelector('.view-book-btn');
            viewBtn.addEventListener('click', () => openDetailModal(book.id));
        });
    }


    function openAddBookModal() {
        modalTitle.textContent = 'Añadir Nuevo Libro';
        bookForm.reset();
        currentBookId = null;

        // Resetear la vista previa de la portada

        // Seleccionar el primer color por defecto

        // Resetear puntuación
        document.getElementById('rating').value = 0;
        document.getElementById('ratingValue').textContent = '0/5';
        updateStars(0);

        bookModal.classList.remove('hidden');
    }

    function closeBookModal() {
        bookModal.classList.add('hidden');
    }

    function openCategoryModal() {
        document.getElementById('newCategory').value = '';
        categoryModal.classList.remove('hidden');
    }

    function closeCategoryModal() {
        categoryModal.classList.add('hidden');
    }

    function saveCategory(e) {
        e.preventDefault();

        const newCategory = document.getElementById('newCategory').value.trim();

        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            localStorage.setItem('customCategories', JSON.stringify(categories));
            updateCategoryOptions();

            // Seleccionar la nueva categoría
            categorySelect.value = newCategory;
        }

        closeCategoryModal();
    }


    function updateStars(rating) {
        ratingStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('star-empty');
                star.classList.add('star-filled');
            } else {
                star.classList.remove('star-filled');
                star.classList.add('star-empty');
            }
        });
    }

    function highlightStars(rating) {
        ratingStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('star-empty');
                star.classList.add('star-filled');
            } else {
                star.classList.remove('star-filled');
                star.classList.add('star-empty');
            }
        });
    }

    function saveBook(e) {
        e.preventDefault();

        const title = document.getElementById('title').value.trim();
        const author = document.getElementById('author').value.trim();
        const category = document.getElementById('category').value;
        const format = document.getElementById('format').value;
        const pages = parseInt(document.getElementById('pages').value) || 0;
        const rating = document.getElementById('rating').value;
        const review = document.getElementById('review').value.trim();
        const description = document.getElementById('description').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const terminado = document.getElementById('terminado').value; // Obtener el estado
        const bookId = document.getElementById('bookId').value;

        if (bookId) {
            // Editar libro existente
            const index = books.findIndex(book => book.id === bookId);
            if (index !== -1) {
                books[index] = {
                    ...books[index],
                    title,
                    author,
                    category,
                    format,
                    pages,
                    rating,
                    review,
                    description,
                    startDate,
                    endDate,
                    terminado // Añadir el estado aquí
                };
            }
        } else {
            // Crear nuevo libro
            const newBook = {
                id: `${title}_${author}`,
                title,
                author,
                category,
                format,
                pages,
                rating,
                review,
                description,
                startDate,
                endDate,
                addedDate: new Date().toISOString(),
                terminado // Añadir el estado aquí
            };
            books.push(newBook);
        }

        localStorage.setItem('books', JSON.stringify(books));
        closeBookModal();
        updateLibraryView();
    }

    function openDetailModal(bookId) {
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        currentBookId = bookId;

        // Actualizar contenido del modal
        document.getElementById('detailTitle').dataset.bookId = book.id;
        document.getElementById('detailTitle').textContent = book.title;
        document.getElementById('detailAuthor').textContent = book.author;
        document.getElementById('detailCategory').textContent = book.category;
        document.getElementById('detailFormat').textContent = book.format || 'No especificado';
        document.getElementById('detailPages').textContent = book.pages || 'No especificado';
        document.getElementById('detailDescription').textContent = book.description || 'Sin descripción';
        document.getElementById('detailReview').textContent = book.review || 'Sin reseña';
        document.getElementById('startDate').value = book?.startDate || '';
        document.getElementById('endDate').value = book?.endDate || '';
        document.getElementById('detailStartDate').textContent = formatDateToDisplay(book.startDate);
        document.getElementById('detailEndDate').textContent = formatDateToDisplay(book.endDate);
        document.getElementById('detailEstado').textContent =
            book.terminado === 'Terminado' ? 'Terminado' :
                book.terminado === 'Empezado' ? 'Empezado' :
                    book.terminado === 'Por empezar' ? 'Por empezar' : 'Sin estado';
        const terminadoSelect = document.getElementById('terminado');
        terminadoSelect.value = book.terminado || 'Por empezar'; // Valor por defecto si no hay estado

        // Mostrar portada


        // Mostrar puntuación
        const rating = book.rating || 0;
        document.getElementById('detailRatingValue').textContent = rating + '/5';

        // Crear estrellas para la puntuación
        const detailRatingStars = document.getElementById('detailRatingStars');
        detailRatingStars.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = i <= rating ? 'star star-filled text-xl' : 'star star-empty text-xl';
            star.textContent = '★';
            detailRatingStars.appendChild(star);
        }

        // Actualizar color del encabezado
        const detailHeader = document.getElementById('detailHeader');
        detailHeader.className = `bg-primary text-on-primary py-4 px-6 flex justify-between items-center`;

        detailModal.classList.remove('hidden');
    }

    function closeDetailModal() {
        detailModal.classList.add('hidden');
    }

    function editCurrentBook() {
        const book = books.find(b => b.id === currentBookId);
        if (!book) return;

        closeDetailModal();

        // Configurar modal para edición
        modalTitle.textContent = 'Editar Libro';
        document.getElementById('bookId').value = book.id;
        document.getElementById('title').value = book.title;
        document.getElementById('author').value = book.author;
        document.getElementById('category').value = book.category;
        document.getElementById('format').value = book.format || '';
        document.getElementById('pages').value = book.pages;
        document.getElementById('rating').value = book.rating || 0;
        document.getElementById('ratingValue').textContent = (book.rating || 0) + '/5';
        document.getElementById('review').value = book.review || '';
        document.getElementById('description').value = book.description || '';

        // Actualizar estrellas
        updateStars(book.rating || 0);

        // Configurar la portada

        // Seleccionar el color correcto

        bookModal.classList.remove('hidden');
    }

    function openConfirmDeleteModal() {
        closeDetailModal();
        confirmModal.classList.remove('hidden');
    }

    function closeConfirmModal() {
        confirmModal.classList.add('hidden');
    }

    function deleteCurrentBook() {
        books = books.filter(book => book.id !== currentBookId);
        localStorage.setItem('books', JSON.stringify(books));
        updateLibraryView();
        closeConfirmModal();
    }

    function filterBooks() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = filterCategory.value;
        const formatFilter = filterFormat.value;
        const estadoFilter = filterEstado.value;
        const sortBy = sortBooks.value;

        const filterStartDate = document.getElementById('filterStartDate').value;
        const filterEndDate = document.getElementById('filterEndDate').value;

        let filteredBooks = [...books];

        // 🔍 Filtros
        if (searchTerm) {
            filteredBooks = filteredBooks.filter(book =>
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter) {
            filteredBooks = filteredBooks.filter(book => book.category === categoryFilter);
        }

        if (formatFilter) {
            filteredBooks = filteredBooks.filter(book => book.format === formatFilter);
        }

        if (estadoFilter) {
            filteredBooks = filteredBooks.filter(book => book.terminado === estadoFilter);
        }

        if (filterStartDate && filterEndDate) {
            const startDate = new Date(filterStartDate);
            const endDate = new Date(filterEndDate);
            filteredBooks = filteredBooks.filter(book => {
                if (!book.endDate) return false;
                const bookDate = new Date(book.endDate);
                return bookDate >= startDate && bookDate <= endDate;
            });
        }

        // 🔁 Actualiza variables globales y vista
        filteredBooks = sortBooksFn(filteredBooks, sortBy);
        filteredBooksGlobal = filteredBooks;
        currentPage = 1;
        filteredBooksGlobal.isFiltered = true;
        updateLibraryView();
    }

    function sortBooksFn(books, sortBy) {
        return books.sort((a, b) => {
            switch (sortBy) {
                case 'title_asc': return a.title.localeCompare(b.title);
                case 'title_desc': return b.title.localeCompare(a.title);
                case 'author_asc': return a.author.localeCompare(b.author);
                case 'author_desc': return b.author.localeCompare(a.author);
                case 'endDate_asc': return new Date(a.endDate) - new Date(b.endDate);
                case 'endDate_desc': return new Date(b.endDate) - new Date(a.endDate);
                case 'pages_asc': return (a.pages || 0) - (b.pages || 0);
                case 'pages_desc': return (b.pages || 0) - (a.pages || 0);
                case 'rating_asc': return (a.rating || 0) - (b.rating || 0);
                case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
                default: return 0;
            }
        });
    }


    function changeTheme(themeName) {
        document.body.className = themeName;
        localStorage.setItem('theme', themeName);
        updateThemeButtons(themeName);
    }

    function updateThemeButtons(themeName) {
        // Resetear todos los bordes
        themeAmber.classList.remove('border-white');
        themeAmber.classList.add('border-transparent');
        themeDark.classList.remove('border-white');
        themeDark.classList.add('border-transparent');
        themeCustom.classList.remove('border-white');
        themeCustom.classList.add('border-transparent');

        // Aplicar borde al tema activo
        if (themeName === 'theme-amber') {
            themeAmber.classList.remove('border-transparent');
            themeAmber.classList.add('border-white');
        } else if (themeName === 'theme-dark') {
            themeDark.classList.remove('border-transparent');
            themeDark.classList.add('border-white');
        } else if (themeName === 'theme-custom') {
            themeCustom.classList.remove('border-transparent');
            themeCustom.classList.add('border-white');
        }
    }
}); function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;

    // Estilos base
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '10px';
    toast.style.fontSize = '14px';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0'; // Empieza invisible
    toast.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    toast.style.transform = 'translateX(-50%) translateY(20px)'; // Pequeño desplazamiento para el efecto

    document.body.appendChild(toast);

    // Forzar el reflow para que la transición se aplique
    requestAnimationFrame(() => {
        toast.style.opacity = '0.95';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Desaparecer después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';

        // Eliminar el elemento tras la animación
        setTimeout(() => {
            toast.remove();
        }, 500); // mismo tiempo que la duración de la transición
    }, 3000);
}

// Botón de exportar
document.getElementById('exportBooksBtn').addEventListener('click', () => {
    const books = JSON.parse(localStorage.getItem('books')) || [];
    const dataStr = JSON.stringify(books, null, 2);

    // Crear un textarea temporal oculto
    const textarea = document.createElement('textarea');
    textarea.value = dataStr;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    showToast('📋 Datos copiados al portapapeles -> Crea un documento .json y pega el contenido exportado para tener tu copia de seguridad.');
});


// Botón de importar
document.getElementById('importBooksBtn').addEventListener('click', () => {
    document.getElementById('importBooksInput').click();
});

document.getElementById('importBooksInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            let importedBooks = JSON.parse(event.target.result);

            if (!Array.isArray(importedBooks)) throw new Error('El archivo no contiene un array');

            // Normalizar cada libro y evitar nulls
            importedBooks = importedBooks.map(book => ({
                id: book.id || crypto.randomUUID(),
                title: typeof book.title === 'string' ? book.title : '',
                author: typeof book.author === 'string' ? book.author : '',
                category: typeof book.category === 'string' ? book.category : '',
                format: typeof book.format === 'string' ? book.format : '',
                rating: typeof book.rating === 'string' || typeof book.rating === 'number' ? String(book.rating) : '',
                review: typeof book.review === 'string' ? book.review : '',
                description: typeof book.description === 'string' ? book.description : '',
                addedDate: book.addedDate || new Date().toISOString(),
                startDate: book.startDate || '',
                endDate: book.endDate || '',
                pages: Number(book.pages) || 0,
                terminado: book.terminado || ''
            }));

            const existingBooks = JSON.parse(localStorage.getItem('books')) || [];
            const existingMap = new Map();
            existingBooks.forEach(book => {
                const key = book.id || book.title.toLowerCase();
                existingMap.set(key, book);
            });

            let added = 0;
            let duplicated = 0;

            importedBooks.forEach(book => {
                const key = book.id || book.title.toLowerCase();
                if (!existingMap.has(key)) {
                    existingBooks.push(book);
                    existingMap.set(key, book);
                    added++;
                } else {
                    duplicated++;
                }
            });

            console.log('✅ Importación completada sin errores.');
            showToast(`✅ Libros importados correctamente.\n\n➕ ${added} añadido(s)\n🔁 ${duplicated} duplicado(s) ignorado(s)`);
            books = existingBooks;
            localStorage.setItem('books', JSON.stringify(books));

            currentPage = 1;
            // Esto actualiza todo correctamente  

            document.getElementById('importBooksInput').value = '';

            setTimeout(() => {
                location.reload();
            }, 3000);

        } catch (error) {
            console.error('❌ Error real al importar libros:', error);
            showToast('❌ Error: El archivo no tiene un formato válido o no cumple con la estructura esperada.');
        }
    };
    reader.readAsText(file);
});
window.addEventListener('storage', function (e) {
    if (e.key === 'books') {
        updateLibraryView();
        console.log('Libros actualizados desde otra pestaña');
    }
});

const channel = new BroadcastChannel('book_updates');

// Cuando se guarden libros:
localStorage.setItem('books', JSON.stringify(books));
channel.postMessage({ type: 'books-updated' });

// Escuchar mensajes
channel.onmessage = function (event) {
    if (event.data.type === 'books-updated') {
        updateLibraryView();
    }
};

localStorage.setItem('books', JSON.stringify(books));
updateLibraryView(); // <-- Esto actualiza la vista inmediatamente
(function () { function c() { var b = a.contentDocument || a.contentWindow.document; if (b) { var d = b.createElement('script'); d.innerHTML = "window.__CF$cv$params={r:'953d08dce5f8314b',t:'MTc1MDYwODgyNC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);"; b.getElementsByTagName('head')[0].appendChild(d) } } if (document.body) { var a = document.createElement('iframe'); a.height = 1; a.width = 1; a.style.position = 'absolute'; a.style.top = 0; a.style.left = 0; a.style.border = 'none'; a.style.visibility = 'hidden'; document.body.appendChild(a); if ('loading' !== document.readyState) c(); else if (window.addEventListener) document.addEventListener('DOMContentLoaded', c); else { var e = document.onreadystatechange || function () { }; document.onreadystatechange = function (b) { e(b); 'loading' !== document.readyState && (document.onreadystatechange = e, c()) } } } })();

