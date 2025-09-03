document.addEventListener('DOMContentLoaded', function () {
    const sections = Array.from(document.querySelectorAll('.timeline-content section'));
    const navButtons = document.querySelectorAll('.timeline-nav button');
    const timelineScrollArea = document.getElementById('timeline-scroll-area');
    const timelineContainer = document.querySelector('.timeline-container');
    const preTimelineContent = document.querySelector('.pre-timeline-content');
    const sectionCount = sections.length;
    
    // Calculate offsets
    const preTimelineHeight = preTimelineContent.offsetHeight;
    const timelineHeight = window.innerHeight * sectionCount;
    
    // Set timeline scroll area height
    timelineScrollArea.style.height = `${timelineHeight}px`;

    // Track timeline state
    let isTimelineActive = false;
    let lastActiveIndex = -1;

    function setActiveSection(index, scrollProgress = 0, isExiting = false) {
        sections.forEach((section, i) => {
            // Don't immediately remove classes, let CSS transitions handle the animation
            if (!isExiting) {
                section.classList.remove('active', 'above', 'below', 'entering', 'exiting');
            }
            
            if (i === index && !isExiting) {
                section.classList.add('active');
                
                if (i === sectionCount - 1 && scrollProgress > 0.3) {
                    // Last section slides up and fades out
                    const exitProgress = (scrollProgress - 0.3) / 0.7;
                    const yOffset = exitProgress * -100;
                    const opacity = Math.max(0, 1 - exitProgress * 1.5);
                    section.style.transform = `translate(-50%, -50%) translateY(${yOffset}vh)`;
                    section.style.opacity = opacity;
                }
                else {
                    // Normal active state with subtle movement
                    const yOffset = scrollProgress * 15;
                    section.style.transform = `translate(-50%, -50%) translateY(${yOffset}px)`;
                    section.style.opacity = 1;
                }
                
                // Handle background crossfade
                updateBackground(i, scrollProgress);
                
            } else if (i === index - 1 && !isExiting) {
                // Previous section - moving up and out
                section.classList.add('exiting');
                const yOffset = -50 - (scrollProgress * 50);
                const opacity = Math.max(0.1, 0.7 - (scrollProgress * 0.6));
                section.style.transform = `translate(-50%, -50%) translateY(${yOffset}vh)`;
                section.style.opacity = opacity;
            } else if (i === index + 1 && !isExiting) {
                // Next section - moving up and in
                section.classList.add('entering');
                const yOffset = 100 - (scrollProgress * 50);
                const opacity = Math.min(0.7, scrollProgress * 1.4);
                section.style.transform = `translate(-50%, -50%) translateY(${yOffset}vh)`;
                section.style.opacity = opacity;
            } else if (i < index && !isExiting) {
                section.classList.add('above');
                section.style.transform = `translate(-50%, -50%) translateY(-100vh)`;
                section.style.opacity = 0.1;
            } else if (!isExiting) {
                section.classList.add('below');
                section.style.transform = `translate(-50%, -50%) translateY(100vh)`;
                section.style.opacity = 0.1;
            }
        });

        // Update nav button states
        if (!isExiting) {
            navButtons.forEach((btn, i) => {
                btn.classList.toggle('active', i === index);
            });
        }
    }

    function handleTimelineExit(direction, currentIndex = 0) {
        // Animate sections out based on exit direction AND current position
        sections.forEach((section, i) => {
            if (direction === 'top') {
                // Exiting from the top - sections should slide down and fade out
                // Stagger based on distance from current position
                const delay = Math.abs(i - currentIndex) * 50;
                setTimeout(() => {
                    section.style.transform = `translate(-50%, -50%) translateY(100vh)`;
                    section.style.opacity = '0';
                }, delay);
            } else if (direction === 'bottom') {
                // Exiting from the bottom - sections should slide up and fade out
                const delay = (sectionCount - 1 - i) * 50;
                setTimeout(() => {
                    section.style.transform = `translate(-50%, -50%) translateY(-100vh)`;
                    section.style.opacity = '0';
                }, delay);
            }
        });

        // Let nav buttons fade out naturally through the overlap function
        navButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        // Hide background overlays with transition
        setTimeout(() => {
            document.querySelectorAll('.background-overlay').forEach((overlay, i) => {
                if (i !== 0) { // Keep first background visible
                    overlay.classList.remove('active');
                    overlay.style.opacity = '0';
                }
            });
        }, 200);

        // Finally remove the active class from container after animations complete
        setTimeout(() => {
            timelineContainer.classList.remove('active');
            // Reset classes after animation completes
            sections.forEach(section => {
                section.classList.remove('active', 'above', 'below', 'entering', 'exiting');
                // Ensure sections are fully hidden after exit
                section.style.transform = '';
                section.style.opacity = '';
            });
        }, 800);
    }

    function updateBackground(activeIndex, scrollProgress) {
        const backgroundOverlays = document.querySelectorAll('.background-overlay');
        
        backgroundOverlays.forEach((overlay, i) => {
            if (i === activeIndex) {
                overlay.classList.add('active');
            } else if (i === activeIndex + 1 && scrollProgress > 0.7) {
                const fadeProgress = (scrollProgress - 0.7) / 0.3;
                overlay.style.opacity = fadeProgress;
                overlay.classList.remove('active');
            } else if (i === activeIndex - 1 && scrollProgress < 0.3) {
                const fadeProgress = 1 - (scrollProgress / 0.3);
                overlay.style.opacity = fadeProgress;
                overlay.classList.remove('active');
            } else {
                overlay.classList.remove('active');
                overlay.style.opacity = 0;
            }
        });
    }

    function handleTimelineEntry(entryDirection, index, scrollProgress) {
        // Reset sections to prepare for entry animation
        sections.forEach((section, i) => {
            section.style.transition = 'none'; // Temporarily disable transition for positioning
            
            if (entryDirection === 'top') {
                // Entering from top - position sections below
                // But keep the active section closer for smoother entry
                if (i === index) {
                    section.style.transform = `translate(-50%, -50%) translateY(${100 - (scrollProgress * 50)}vh)`;
                    section.style.opacity = '0';
                } else {
                    section.style.transform = `translate(-50%, -50%) translateY(100vh)`;
                    section.style.opacity = '0';
                }
            } else {
                // Entering from bottom - position sections above
                if (i === index) {
                    section.style.transform = `translate(-50%, -50%) translateY(${-100 + (scrollProgress * 50)}vh)`;
                    section.style.opacity = '0';
                } else {
                    section.style.transform = `translate(-50%, -50%) translateY(-100vh)`;
                    section.style.opacity = '0';
                }
            }
            
            section.classList.remove('active', 'above', 'below', 'entering', 'exiting');
        });
        
        // Reset navigation buttons
        navButtons.forEach(btn => {
            btn.style.transform = '';
            btn.style.opacity = '';
            btn.style.pointerEvents = '';
            btn.classList.remove('active');
        });
        
        // Force reflow
        void timelineContainer.offsetHeight;
        
        // Re-enable transitions after a brief delay
        requestAnimationFrame(() => {
            sections.forEach(section => {
                section.style.transition = '';
            });
            
            // Small additional delay to ensure transition is applied
            requestAnimationFrame(() => {
                // Now set the active section which will trigger animations
                setActiveSection(index, scrollProgress);
            });
        });
    }

    function onScroll() {
        const scrollY = window.scrollY;
        const timelineStart = preTimelineHeight;
        const timelineEnd = preTimelineHeight + timelineHeight;

        const activationBuffer = window.innerHeight * 0.2;
        const exitBuffer = window.innerHeight * 0.15; // Slightly smaller exit buffer for smoother exit
        
        if (scrollY >= timelineStart - activationBuffer && scrollY < timelineEnd + activationBuffer) {
            // Timeline should be active
            const wasInactive = !isTimelineActive;
            
            if (wasInactive) {
                timelineContainer.classList.add('active');
                isTimelineActive = true;
                
                // Determine entry direction and handle entry animation
                const entryDirection = scrollY < timelineStart + (timelineHeight / 2) ? 'top' : 'bottom';
                
                // Calculate initial index and progress for entry
                const adjustedTimelineStart = timelineStart - activationBuffer;
                const relativeScrollY = Math.max(0, scrollY - adjustedTimelineStart);
                const sectionHeight = window.innerHeight;
                
                const rawIndex = relativeScrollY / sectionHeight;
                let index = Math.floor(rawIndex);
                
                if (scrollY < timelineStart + (sectionHeight * 0.3)) {
                    index = 0;
                }
                
                index = Math.max(0, Math.min(sectionCount - 1, index));
                
                let scrollProgress;
                if (index === 0) {
                    const effectiveScrollY = Math.max(0, scrollY - (timelineStart - activationBuffer));
                    scrollProgress = Math.max(0, Math.min(1, effectiveScrollY / sectionHeight));
                } else {
                    const sectionStart = index * sectionHeight;
                    scrollProgress = Math.max(0, Math.min(1, (relativeScrollY - sectionStart) / sectionHeight));
                }
                
                handleTimelineEntry(entryDirection, index, scrollProgress);
            }
            
            updateNavigationOverlap(scrollY, timelineStart, timelineEnd);
            
            const adjustedTimelineStart = timelineStart - activationBuffer;
            const relativeScrollY = Math.max(0, scrollY - adjustedTimelineStart);
            const sectionHeight = window.innerHeight;
            
            const rawIndex = relativeScrollY / sectionHeight;
            let index = Math.floor(rawIndex);
            
            if (scrollY < timelineStart + (sectionHeight * 0.3)) {
                index = 0;
            }
            
            index = Math.max(0, Math.min(sectionCount - 1, index));
            lastActiveIndex = index;
            
            let sectionStart, scrollProgress;
            
            if (index === 0) {
                sectionStart = 0;
                const effectiveScrollY = Math.max(0, scrollY - (timelineStart - activationBuffer));
                scrollProgress = Math.max(0, Math.min(1, effectiveScrollY / sectionHeight));
            } else {
                sectionStart = index * sectionHeight;
                scrollProgress = Math.max(0, Math.min(1, (relativeScrollY - sectionStart) / sectionHeight));
            }
            
            if (!wasInactive) {
                // Only call setActiveSection if we didn't just enter (it's called in handleTimelineEntry)
                setActiveSection(index, scrollProgress);
            }
            
            // Handle exit preparation when approaching boundaries
            if (scrollY < timelineStart - exitBuffer || scrollY > timelineEnd + exitBuffer) {
                // Start fading out the active section as we approach the exit point
                const fadeDistance = exitBuffer;
                let fadeProgress = 0;
                
                if (scrollY < timelineStart - exitBuffer) {
                    fadeProgress = Math.max(0, Math.min(1, (timelineStart - exitBuffer - scrollY) / fadeDistance));
                } else if (scrollY > timelineEnd + exitBuffer) {
                    fadeProgress = Math.max(0, Math.min(1, (scrollY - (timelineEnd + exitBuffer)) / fadeDistance));
                }
                
                if (fadeProgress > 0 && sections[index]) {
                    sections[index].style.opacity = 1 - (fadeProgress * 0.5);
                }
            }
            
        } else {
            // Timeline should be inactive
            if (isTimelineActive) {
                isTimelineActive = false;
                
                // Determine exit direction and pass the current index
                const exitDirection = scrollY < timelineStart - exitBuffer ? 'top' : 'bottom';
                handleTimelineExit(exitDirection, lastActiveIndex);
                
                lastActiveIndex = -1;
            }
            
            // Continue to update navigation overlap even when timeline is inactive
            updateNavigationOverlap(scrollY, timelineStart, timelineEnd);
        }
    }

    function updateNavigationOverlap(scrollY, timelineStart, timelineEnd) {
        const timelineNav = document.querySelector('.timeline-nav');
        
        const navRect = timelineNav.getBoundingClientRect();
        const navTop = navRect.top + scrollY;
        const navBottom = navRect.bottom + scrollY;
        
        const preTimelineEnd = timelineStart;
        const postTimelineStart = timelineEnd;
        
        navButtons.forEach((btn, i) => {
            const btnRect = btn.getBoundingClientRect();
            const btnTop = btnRect.top + scrollY;
            const btnBottom = btnRect.bottom + scrollY;
            
            // For top boundary: reverse stagger for exit (first button disappears first)
            const reverseTopStaggerOffset = (navButtons.length - 1 - i) * 60;
            const adjustedPreTimelineEnd = preTimelineEnd + reverseTopStaggerOffset;
            
            // For bottom boundary: reverse stagger (last button disappears first)
            const reverseBottomStaggerOffset = (navButtons.length - 1 - i) * 40;
            const adjustedPostTimelineStart = postTimelineStart - reverseBottomStaggerOffset;
            
            let opacity = 1;
            let translateY = 0;
            let scale = 1;
            let pointerEvents = 'auto';
            
            if (btnTop < adjustedPreTimelineEnd) {
                const overlapAmount = adjustedPreTimelineEnd - btnTop;
                const buttonHeight = btnRect.height;
                const transitionDistance = buttonHeight + reverseTopStaggerOffset;
                const overlapRatio = Math.min(1, overlapAmount / transitionDistance);
                
                opacity = 1 - overlapRatio;
                translateY = overlapRatio * -40;
                scale = 1 - (overlapRatio * 0.15);
                pointerEvents = overlapRatio > 0.3 ? 'none' : 'auto';
            }
            else if (btnBottom > adjustedPostTimelineStart) {
                const overlapAmount = btnBottom - adjustedPostTimelineStart;
                const buttonHeight = btnRect.height;
                const transitionDistance = buttonHeight + reverseBottomStaggerOffset;
                const overlapRatio = Math.min(1, overlapAmount / transitionDistance);
                
                opacity = 1 - overlapRatio;
                translateY = overlapRatio * 35;
                scale = 1 - (overlapRatio * 0.12);
                pointerEvents = overlapRatio > 0.3 ? 'none' : 'auto';
            }
            
            // Apply styles with transition (CSS handles the animation)
            btn.style.transform = `translateY(${translateY}px) scale(${scale})`;
            btn.style.opacity = opacity;
            btn.style.pointerEvents = pointerEvents;
        });
    }

    function resetNavigation() {
        // Don't immediately reset - let the transition happen
        setTimeout(() => {
            navButtons.forEach(btn => {
                btn.style.transform = '';
                btn.style.opacity = '';
                btn.style.pointerEvents = '';
            });
        }, 600);
    }

    // Navigation button click handlers
    navButtons.forEach((btn, i) => {
        btn.addEventListener('click', () => {
            const targetPosition = preTimelineHeight + (i * window.innerHeight);
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });

    // Event listeners
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', () => {
        const newPreTimelineHeight = preTimelineContent.offsetHeight;
        const newTimelineHeight = window.innerHeight * sectionCount;
        timelineScrollArea.style.height = `${newTimelineHeight}px`;
        setTimeout(onScroll, 100);
    });

    // Initial setup
    setTimeout(() => {
        onScroll();
    }, 100);
});