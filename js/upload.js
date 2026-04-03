import { auth } from './auth.js';
import { videoService } from './videos.js';

let isLoginMode = true;

async function init() {
    const user = await auth.getUser();
    
    if (!user) {
        alert('Сначала войдите в аккаунт');
        window.location.href = 'index.html';
        return;
    }
    
    setupNavbar(user);
    setupAuthModal();
    setupUploadForm(user);
}

function setupNavbar(user) {
    const nav = document.getElementById('nav-auth');
    if (!nav) return;
    
    const avatarLetter = user.email ? user.email[0].toUpperCase() : 'U';
    
    nav.innerHTML = `
        <div class="nav-buttons">
            <button class="create-btn" id="createVideoBtn">
                <span>📹</span> Создать
            </button>
            <div class="user-menu">
                <button class="avatar-btn" id="avatarBtn">
                    <div class="avatar">${avatarLetter}</div>
                </button>
                <div class="dropdown-menu" id="dropdownMenu">
                    <div class="dropdown-header">
                        <div class="dropdown-avatar">${avatarLetter}</div>
                        <div class="dropdown-info">
                            <div class="dropdown-email">${user.email}</div>
                            <div class="dropdown-role">Пользователь</div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="upload.html" class="dropdown-item">
                        <span class="dropdown-icon">📤</span>
                        <span>Загрузить видео</span>
                    </a>
                    <a href="profile.html" class="dropdown-item">
                        <span class="dropdown-icon">📺</span>
                        <span>Мой канал</span>
                    </a>
                    <a href="index.html" class="dropdown-item">
                        <span class="dropdown-icon">🏠</span>
                        <span>Главная</span>
                    </a>
                    <button id="logoutDropdownBtn" class="dropdown-item">
                        <span class="dropdown-icon">🚪</span>
                        <span>Выйти</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const createBtn = document.getElementById('createVideoBtn');
    if (createBtn) {
        createBtn.onclick = () => {
            window.location.href = 'upload.html';
        };
    }
    
    const avatarBtn = document.getElementById('avatarBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (avatarBtn && dropdownMenu) {
        avatarBtn.onclick = (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        };
        
        document.addEventListener('click', (e) => {
            if (!avatarBtn.contains(e.target)) {
                dropdownMenu.classList.remove('active');
            }
        });
    }
    
    const logoutBtn = document.getElementById('logoutDropdownBtn');
    if (logoutBtn) logoutBtn.onclick = () => auth.signOut();
}

function setupAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    const closeBtn = document.getElementById('closeAuthModal');
    const form = document.getElementById('authForm');
    const switchText = document.getElementById('authSwitchText');
    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('active');
    }
    
    window.onclick = (e) => { 
        if (e.target === modal) modal.classList.remove('active'); 
    };

    if (switchText) {
        switchText.onclick = () => {
            isLoginMode = !isLoginMode;
            if (title) title.innerText = isLoginMode ? "Вход" : "Регистрация";
            if (submitBtn) submitBtn.innerText = isLoginMode ? "Войти" : "Создать аккаунт";
            switchText.innerText = isLoginMode ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти";
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            if (submitBtn) {
                submitBtn.innerText = "Ожидайте...";
                submitBtn.disabled = true;
            }

            let result;
            if (isLoginMode) {
                result = await auth.signIn(email, password);
            } else {
                result = await auth.signUp(email, password);
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = isLoginMode ? "Войти" : "Создать аккаунт";
            }

            if (result.error) {
                alert("Ошибка: " + result.error.message);
            } else {
                if (!isLoginMode) alert("Регистрация успешна! Теперь вы можете войти.");
                location.reload();
            }
        };
    }
}

function setupUploadForm(user) {
    const videoFileInput = document.getElementById('v-file');
    const videoFileName = document.getElementById('videoFileName');
    const thumbnailFileInput = document.getElementById('v-thumbnail');
    const thumbnailFileName = document.getElementById('thumbnailFileName');
    
    if (videoFileInput && videoFileName) {
        videoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                videoFileName.textContent = `📹 ${file.name}`;
                videoFileName.classList.add('has-file');
            } else {
                videoFileName.textContent = 'Файл не выбран';
                videoFileName.classList.remove('has-file');
            }
        });
    }
    
    if (thumbnailFileInput && thumbnailFileName) {
        thumbnailFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                thumbnailFileName.textContent = `🖼️ ${file.name}`;
                thumbnailFileName.classList.add('has-file');
            } else {
                thumbnailFileName.textContent = 'Файл не выбран';
                thumbnailFileName.classList.remove('has-file');
            }
        });
    }
    
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('v-title').value;
            const description = document.getElementById('v-description').value;
            const videoFile = videoFileInput.files[0];
            const thumbnailFile = thumbnailFileInput.files[0];
            
            if (!title || !videoFile) {
                alert('Пожалуйста, заполните название и выберите видео файл');
                return;
            }
            
            const submitBtn = e.target.querySelector('.upload-btn');
            const progressDiv = document.getElementById('uploadProgress');
            const progressBarFill = document.getElementById('progressBarFill');
            const progressText = document.getElementById('progressText');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Загрузка...';
            }
            if (progressDiv) progressDiv.style.display = 'block';
            
            const result = await videoService.uploadVideo(
                videoFile, 
                thumbnailFile, 
                title, 
                description, 
                user.id,
                (percent) => {
                    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
                    if (progressText) progressText.innerText = `${Math.round(percent)}%`;
                }
            );
            
            if (result.success) {
                alert('✅ Видео успешно загружено!');
                window.location.href = 'index.html';
            } else {
                alert('❌ Ошибка при загрузке: ' + result.error);
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>⬆️</span> Опубликовать';
            }
            if (progressDiv) progressDiv.style.display = 'none';
            if (progressBarFill) progressBarFill.style.width = '0%';
        };
    }
}

init();
