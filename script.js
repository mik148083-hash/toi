// State variables
        let isOpened = false;
        let autoScrollActive = false;
        let autoScrollInterval = null;
        let isMusicPlaying = false;
        let synth = null;
        let musicLoop = null;

        // Музыка жана YouTube жөндөөлөрү config.js файлында.
        let MUSIC_BLOB = null;
        let ytPlayer = null, ytReady = false, ytWantPlay = false;
        let audioEl = null;

        // Initial sample guest wishes (stored in localStorage as well)
        const defaultWishes = [
            {
                name: "Нурлан & Айзада",
                status: "Жубайым / үй-бүлөм менен келем",
                wish: "Адилет, Акбермет! Кармашкан колуңар үзүлбөсүн, бактылуу түгөйлөрдөн болгула! Үйүңөрдөн кут, береке кетпесин!",
                time: "Бүгүн"
            },
            {
                name: "Бакытбек агай",
                status: "Сөзсүз келем!",
                wish: "Жаш жубайларга ак жол, узун өмүр, бекем ден соолук каалайм. Куш бооңор бек болсун!",
                time: "Кечээ"
            }
        ];

        function getWishes() {
            try {
                const saved = localStorage.getItem('adilet_akbermet_wishes');
                return saved ? JSON.parse(saved) : defaultWishes;
            } catch (e) {
                return defaultWishes;
            }
        }

        function saveWishes(wishes) {
            try {
                localStorage.setItem('adilet_akbermet_wishes', JSON.stringify(wishes));
            } catch (e) {
                console.warn('Storage unavailable');
            }
        }

        // Open Envelope Sequence
        function openEnvelope() {
            if (isOpened) return;
            isOpened = true;

            const envelopeBox = document.getElementById('envelopeBox');
            const envelopeScreen = document.getElementById('envelopeScreen');
            const invitationContent = document.getElementById('invitationContent');
            const mainBody = document.getElementById('mainBody');
            const floatingControls = document.getElementById('floatingControls');

            // 1. Trigger 3D flap open & inner white card slide out
            envelopeBox.classList.add('envelope-opened');

            // Start gentle romantic chimes
            startRomanticAudio();

            // 2. Fade out envelope overlay after card is admired
            setTimeout(() => {
                envelopeScreen.style.opacity = '0';
                invitationContent.classList.remove('hidden');
                
                setTimeout(() => {
                    envelopeScreen.style.display = 'none';
                    mainBody.classList.remove('overflow-hidden');
                    invitationContent.style.opacity = '1';
                    floatingControls.classList.remove('hidden');
                    
                    // Trigger initial reveal checks & start gentle petals
                    checkRevealElements();
                    spawnPetals();

                    // Start automatic smooth slow scroll down
                    startAutoScroll();
                }, 850);
            }, 1450);
        }

        // Automatic Slow Scroll Function
        function startAutoScroll() {
            autoScrollActive = true;
            updateScrollButtonUI();

            if (autoScrollInterval) clearInterval(autoScrollInterval);
            
            autoScrollInterval = setInterval(() => {
                if (!autoScrollActive) return;

                // Stop automatically if user reaches bottom of page
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                    stopAutoScroll();
                    return;
                }

                window.scrollBy(0, 1);
                checkRevealElements();
            }, 22);
        }

        function stopAutoScroll() {
            autoScrollActive = false;
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
            updateScrollButtonUI();
        }

        function toggleAutoScroll() {
            if (autoScrollActive) {
                stopAutoScroll();
            } else {
                startAutoScroll();
            }
        }

        function updateScrollButtonUI() {
            const icon = document.getElementById('scrollIcon');
            const text = document.getElementById('scrollText');
            if (!icon || !text) return;

            if (autoScrollActive) {
                icon.className = 'fas fa-pause text-[#C5A059]';
                text.textContent = 'Токтотуу';
            } else {
                icon.className = 'fas fa-play text-[#C5A059]';
                text.textContent = 'Жылдыруу';
            }
        }

        // Pause auto-scroll if user manually touches/wheels so they have full control
        window.addEventListener('wheel', () => {
            if (autoScrollActive) stopAutoScroll();
        }, { passive: true });

        window.addEventListener('touchstart', (e) => {
            if (e.target.closest('#floatingControls') || e.target.closest('#wishesModal')) return;
            if (autoScrollActive) stopAutoScroll();
        }, { passive: true });

        // Slide-in from left to center observer
        function checkRevealElements() {
            const elements = document.querySelectorAll('.reveal-left');
            const triggerBottom = window.innerHeight * 0.9;

            elements.forEach(el => {
                const boxTop = el.getBoundingClientRect().top;
                if (boxTop < triggerBottom) {
                    el.classList.add('visible');
                }
            });
        }

        window.addEventListener('scroll', checkRevealElements);

        // Countdown Timer to December 6, 2026 13:00
        function updateCountdown() {
            const weddingDate = new Date('2026-12-06T13:00:00').getTime();
            const now = new Date().getTime();
            const diff = weddingDate - now;

            if (diff <= 0) {
                document.getElementById('days').textContent = '00';
                document.getElementById('hours').textContent = '00';
                document.getElementById('minutes').textContent = '00';
                document.getElementById('seconds').textContent = '00';
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = String(d).padStart(2, '0');
            document.getElementById('hours').textContent = String(h).padStart(2, '0');
            document.getElementById('minutes').textContent = String(m).padStart(2, '0');
            document.getElementById('seconds').textContent = String(s).padStart(2, '0');
        }
        setInterval(updateCountdown, 1000);
        updateCountdown();

        // RSVP Form Submission
        function handleRsvpSubmit(event) {
            event.preventDefault();
            const nameInput = document.getElementById('guestName');
            const statusInput = document.getElementById('guestStatus');
            const wishInput = document.getElementById('guestWish');

            const name = nameInput.value.trim();
            const status = statusInput.value;
            const wish = wishInput.value.trim() || "Бактылуу болгула! Ак жол!";

            if (!name) return;

            const wishes = getWishes();
            wishes.unshift({
                name: name,
                status: status,
                wish: wish,
                time: "Жаңы эле"
            });
            saveWishes(wishes);

            // Reset form & show success message
            nameInput.value = '';
            wishInput.value = '';
            const successMsg = document.getElementById('rsvpSuccessMsg');
            successMsg.classList.remove('hidden');

            setTimeout(() => {
                successMsg.classList.add('hidden');
                openWishesModal();
            }, 900);
        }

        // Wishes Modal Functions
        function openWishesModal() {
            stopAutoScroll();
            renderWishesList();
            document.getElementById('wishesModal').classList.remove('hidden');
        }

        function closeWishesModal() {
            document.getElementById('wishesModal').classList.add('hidden');
        }

        function renderWishesList() {
            const container = document.getElementById('wishesListContainer');
            const wishes = getWishes();

            if (wishes.length === 0) {
                container.innerHTML = `<p class="text-center text-sm text-[#6E655F] py-8">Азырынча каалоо-тилектер жок. Биринчи болуп жазыңыз!</p>`;
                return;
            }

            container.innerHTML = wishes.map(item => `
                <div class="bg-white p-4 rounded-2xl border border-[#E7DCCB] shadow-sm">
                    <div class="flex justify-between items-start gap-2 mb-1.5">
                        <h4 class="font-serif-elegant text-lg font-bold text-[#2C2724]">${escapeHtml(item.name)}</h4>
                        <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF6F0] text-[#9E7B36] border border-[#C5A059]/30 whitespace-nowrap">
                            ${escapeHtml(item.status)}
                        </span>
                    </div>
                    <p class="text-xs sm:text-sm text-[#4A433E] leading-relaxed italic">
                        «${escapeHtml(item.wish)}»
                    </p>
                    <span class="block text-[10px] text-[#9E7B36]/70 mt-2 text-right">${escapeHtml(item.time || '')}</span>
                </div>
            `).join('');
        }

        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        // Subtle Floating Golden Petals
        function spawnPetals() {
            for (let i = 0; i < 12; i++) {
                const petal = document.createElement('div');
                petal.className = 'petal text-[#C5A059]/40 text-xs';
                petal.innerHTML = i % 2 === 0 ? '<i class="fas fa-heart"></i>' : '✦';
                petal.style.left = Math.random() * 100 + 'vw';
                petal.style.animationDuration = (8 + Math.random() * 8) + 's';
                petal.style.animationDelay = (Math.random() * 5) + 's';
                document.body.appendChild(petal);
            }
        }


        // --- YouTube аудио (жашырын плеер) ---
        function initYT() {
            if (ytPlayer || !window.YT || !YT.Player) return;
            let box = document.getElementById('ytBox');
            if (!box) {
                box = document.createElement('div');
                box.id = 'ytBox';
                box.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:200px;opacity:0;pointer-events:none;';
                box.innerHTML = '<div id="ytPlayer"></div>';
                document.body.appendChild(box);
            }
            ytPlayer = new YT.Player('ytPlayer', {
                width: '200', height: '200', videoId: YT_ID,
                playerVars: { playsinline: 1, controls: 0, loop: 1, playlist: YT_ID },
                events: {
                    onReady: () => {
                        ytReady = true;
                        ytPlayer.setVolume(70);
                        if (ytWantPlay) ytPlayer.playVideo();
                    },
                    onStateChange: (e) => {
                        if (e.data === YT.PlayerState.PLAYING) { isMusicPlaying = true; updateMusicIcon(); }
                        else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) { isMusicPlaying = false; updateMusicIcon(); }
                    },
                    onError: () => { console.warn('YouTube error'); isMusicPlaying = false; updateMusicIcon(); }
                }
            });
        }
        window.onYouTubeIframeAPIReady = initYT;
        if (YT_ID && !MUSIC_SRC) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }

        // Gentle Romantic Ambient Melody with Tone.js
        async function startRomanticAudio() {
            try {
                if (!MUSIC_SRC && YT_ID) {
                    ytWantPlay = true;
                    initYT();
                    if (ytReady) ytPlayer.playVideo();
                    return;
                }
                if (MUSIC_SRC) {
                    if (!audioEl) {
                        audioEl = new Audio(MUSIC_SRC);
                        audioEl.loop = true;
                        audioEl.volume = 0.6;
                    }
                    await audioEl.play();
                    isMusicPlaying = true;
                    updateMusicIcon();
                    return;
                }
                if (typeof Tone === 'undefined') return;
                await Tone.start();
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.8, decay: 0.5, sustain: 0.4, release: 2 }
                }).toDestination();
                synth.volume.value = -16;
                const notes = [
                    ["C4", "E4", "G4"],
                    ["A3", "C4", "E4"],
                    ["F3", "A3", "C4"],
                    ["G3", "B3", "D4"]
                ];
                let step = 0;
                musicLoop = new Tone.Loop(time => {
                    synth.triggerAttackRelease(notes[step % notes.length], "2n", time);
                    step++;
                }, "2n").start(0);
                Tone.Transport.bpm.value = 65;
                Tone.Transport.start();
                isMusicPlaying = true;
                updateMusicIcon();
            } catch (err) {
                console.warn("Audio autoplay blocked or unavailable", err);
            }
        }

        function toggleMusic() {
            if (!MUSIC_SRC && YT_ID) {
                initYT();
                if (!ytReady) { ytWantPlay = true; return; }
                const st = ytPlayer.getPlayerState();
                if (st === YT.PlayerState.PLAYING || st === YT.PlayerState.BUFFERING) {
                    ytWantPlay = false;
                    ytPlayer.pauseVideo();
                    isMusicPlaying = false;
                } else {
                    ytWantPlay = true;
                    ytPlayer.playVideo();
                    isMusicPlaying = true;
                }
                updateMusicIcon();
                return;
            }
            if (MUSIC_SRC) {
                if (!audioEl || audioEl.paused) { startRomanticAudio(); }
                else { audioEl.pause(); isMusicPlaying = false; updateMusicIcon(); }
                return;
            }
            if (!synth) {
                startRomanticAudio();
                return;
            }
            if (isMusicPlaying) {
                Tone.Transport.pause();
                isMusicPlaying = false;
            } else {
                Tone.Transport.start();
                isMusicPlaying = true;
            }
            updateMusicIcon();
        }

        function updateMusicIcon() {
            const icon = document.getElementById('musicIcon');
            if (!icon) return;
            icon.className = isMusicPlaying ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
