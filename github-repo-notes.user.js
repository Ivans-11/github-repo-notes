// ==UserScript==
// @name         GitHub Repo Notes
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add local notes to GitHub repository
// @author       Ivans
// @match        https://github.com/*
// @grant        none
// @icon         https://cdn.simpleicons.org/github/808080
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/535967/GitHub%20Repo%20Notes.user.js
// @updateURL https://update.greasyfork.org/scripts/535967/GitHub%20Repo%20Notes.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const NOTE_KEY_PREFIX = 'gh_repo_note_';

    // Get the full name of the repository
    function getRepoFullName(card) {
        const link = card.querySelector('h3 a[itemprop="name codeRepository"]') || 
                    card.querySelector('h3 a') || 
                    card.querySelector('.search-title a') ||
                    card.querySelector('a.Link--primary.Link.text-bold[data-hovercard-type="repository"]');
        if (!link) return null;
        const href = link.getAttribute('href');
        if (!href) return null;
        return href.substring(1);
    }

    // Get the note from local storage
    function getNote(repoFullName) {
        // Convert to lowercase
        return localStorage.getItem(NOTE_KEY_PREFIX + repoFullName.toLowerCase()) || '';
    }
    // Set the note to local storage
    function setNote(repoFullName, note) {
        if (note) {
            localStorage.setItem(NOTE_KEY_PREFIX + repoFullName.toLowerCase(), note);
        } else {
            localStorage.removeItem(NOTE_KEY_PREFIX + repoFullName.toLowerCase());
        }
    }

    // Create the note button
    function createNoteButton(repoFullName, note, onClick) {
        const btn = document.createElement('button');
        const icon = document.createElement('span');
        icon.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" style="vertical-align: text-bottom; margin-right: 8px; fill: var(--fgColor-muted,var(--color-fg-muted));">
            <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Z"></path>
        </svg>`;
        btn.appendChild(icon);
        btn.appendChild(document.createTextNode(note ? 'Exit' : 'Add'));
        
        btn.style.margin = '4px';
        btn.style.borderRadius = '6px';
        btn.style.padding = '2px 8px';
        btn.style.fontSize = '12px';
        btn.style.cursor = 'pointer';
        btn.style.fontFamily = 'var(--fontStack-sansSerif)';
        btn.style.lineHeight = '20px';
        btn.style.fontWeight = '600';
        btn.style.color = 'var(--button-default-fgColor-rest, var(--color-btn-text))';
        btn.style.backgroundColor = 'var(--button-default-bgColor-rest, var(--color-btn-bg))';
        btn.style.border = '1px solid var(--button-default-borderColor-rest,var(--color-btn-border))';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.height = 'var(--control-small-size,1.75rem)';
        btn.addEventListener('click', onClick);
        return btn;
    }

    // Create the note display
    function createNoteDisplay(note) {
        const div = document.createElement('div');
        const icon = document.createElement('span');
        icon.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" style="vertical-align: text-bottom; margin-right: 8px; fill: var(--fgColor-muted,var(--color-fg-muted));">
            <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Z"></path>
        </svg>`;
        div.appendChild(icon);
        div.appendChild(document.createTextNode(note));
        
        div.style.borderRadius = '6px';
        div.style.padding = '4px 8px';
        div.style.marginTop = '2px';
        div.style.marginBottom = '6px';
        div.style.fontSize = '13px';
        div.style.fontFamily = 'var(--fontStack-sansSerif)';
        div.style.lineHeight = '20px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        return div;
    }

    // Prompt the user to input the note
    function promptNote(oldNote) {
        let note = prompt('Please input your notes (leave blank to be deleted):', oldNote || '');
        if (note === null) return undefined;
        note = note.trim();
        return note;
    }

    // Insert the button and note on the card
    function enhanceCard(card) {
        if (card.dataset.noteEnhanced) return; // Avoid duplicate
        const repoFullName = getRepoFullName(card);
        if (!repoFullName) return;
        card.dataset.noteEnhanced = '1';
        // Find the star button
        let starBtn = card.querySelector('.js-toggler-container.js-social-container.starring-container, .Box-sc-g0xbh4-0.fvaNTI');
        if (!starBtn) return;
        // Create the button
        let note = getNote(repoFullName);
        let btn = createNoteButton(repoFullName, note, function() {
            let newNote = promptNote(note);
            if (typeof newNote === 'undefined') return;
            setNote(repoFullName, newNote);
            // Re-render
            card.dataset.noteEnhanced = '';
            enhanceCard(card);
        });
        // Insert the button
        if (starBtn.parentElement) {
            // Avoid duplicate insertion
            let oldBtn = starBtn.parentElement.querySelector('.gh-note-btn');
            if (oldBtn) oldBtn.remove();
            btn.classList.add('gh-note-btn');
            starBtn.parentElement.appendChild(btn);
        }
        // Note display
        let oldNoteDiv = card.querySelector('.gh-note-display');
        if (oldNoteDiv) oldNoteDiv.remove();
        if (note) {
            let noteDiv = createNoteDisplay(note);
            noteDiv.classList.add('gh-note-display');
            // Put it before the data bar
            let dataInfo = card.querySelector('.f6.color-fg-muted.mt-0.mb-0.width-full, .f6.color-fg-muted.mt-2, .Box-sc-g0xbh4-0.bZkODq');
            if (dataInfo && dataInfo.parentElement) {
                dataInfo.parentElement.insertBefore(noteDiv, dataInfo);
            }
        }
    }

    // Select all repository cards
    function findAllRepoCards() {
        // Adapt to multiple card structures
        let cards = Array.from(document.querySelectorAll(`
            .col-12.d-block.width-full.py-4.border-bottom.color-border-muted,
            li.col-12.d-flex.flex-justify-between.width-full.py-4.border-bottom.color-border-muted,
            .Box-sc-g0xbh4-0.iwUbcA,
            .Box-sc-g0xbh4-0.flszRz,
            .Box-sc-g0xbh4-0.jbaXRR,
            .Box-sc-g0xbh4-0.bmHqGc,
            .Box-sc-g0xbh4-0.hFxojJ,
            section[aria-label="card content"]
        `));
        // Filter out cards without a repository full name
        return cards.filter(card => getRepoFullName(card));
    }

    // Determine if it is a repository page
    function isRepoPage() {
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        return (parts.length === 2 || (parts.length === 4 && parts[2] === 'tree')) && 
               !path.includes('/blob/') && 
               !path.includes('/issues/') && 
               !path.includes('/pulls/');
    }

    // Repository page processing function
    function enhanceRepoPage() {
        if (document.body.dataset.noteEnhanced) return; // Avoid duplicate
        // Get the repository name from the link
        const path = window.location.pathname;
        const parts = path.split('/').filter(Boolean);
        const repoFullName = parts.slice(0, 2).join('/');
        if (!repoFullName) return;
        document.body.dataset.noteEnhanced = '1';

        // Find the button bar
        let actionsList = document.querySelector('.pagehead-actions');
        if (!actionsList) return;

        // Create the button
        let note = getNote(repoFullName);
        let btn = createNoteButton(repoFullName, note, function() {
            let newNote = promptNote(note);
            if (typeof newNote === 'undefined') return;
            setNote(repoFullName, newNote);
            // Re-render
            document.body.dataset.noteEnhanced = '';
            enhanceRepoPage();
        });

        // Create a new li element
        let li = document.createElement('li');
        li.appendChild(btn);

        // Avoid duplicate insertion
        let oldLi = actionsList.querySelector('.gh-note-li');
        if (oldLi) oldLi.remove();
        li.classList.add('gh-note-li');

        // Add to the button bar
        actionsList.appendChild(li);

        // Note display
        let oldNoteDiv = document.querySelector('.gh-note-display');
        if (oldNoteDiv) oldNoteDiv.remove();
        
        if (note) {
            let noteDiv = createNoteDisplay(note);
            noteDiv.classList.add('gh-note-display');
            
            // Find the description
            let description = document.querySelector('.f4.my-3, .f4.my-3.color-fg-muted.text-italic');
            if (description && description.parentElement) {
                description.parentElement.insertBefore(noteDiv, description.nextSibling);
            }
        }
    }

    // Initial processing
    function enhanceAll() {
        if (isRepoPage()) {
            enhanceRepoPage();
        } else {
            findAllRepoCards().forEach(enhanceCard);
        }
    }

    // Listen for DOM changes to adapt to dynamic loading
    const observer = new MutationObserver(() => {
        enhanceAll();
    });
    observer.observe(document.body, {childList: true, subtree: true});

    // First load
    enhanceAll();
})();
