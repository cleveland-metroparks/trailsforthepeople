/**
 * Progress indicator -related functions...
 *
 * For working with a progress bar and text output area.
 * See [deprecated] "application/views/administration/purge_tilestache.phtml" for an example.
 */

/**
 * Show the progress bar, add initial text to it, and make it striped-animated.
 */
function progressActivate(text) {
    $('#progress-indicator').show();
    $('#progress-indicator .progress .progress-bar')
        .html(text)
        .addClass('active')
        .addClass('progress-bar-striped')
        .removeClass('progress-bar-success');
}

/**
 * Set progress bar to 0 (with optional text before & after the percent indication).
 */
function progressInitialize(pre_text, post_text) {
    progressSetPercentFinished(0, pre_text, post_text);
}

/**
 * Set progress bar to the indicated percentage (with optional text before & after the percent indication).
 */
function progressSetPercentFinished(percent, pre_text, post_text) {
    $('#progress-indicator .progress .progress-bar')
        .html(pre_text + percent + post_text)
        .attr('aria-valuenow', percent)
        .css('width', percent.toString() + '%');
}

/**
 * Add text to the status updates section.
 */
function progressAddUpdate(text) {
    var updatesEl = $('#progress-indicator .progress-updates');
    updatesEl
        .show()
        .append(text + "\n")
        .scrollTop(updatesEl[0].scrollHeight);
}

/**
 * Change the progress bar styling (solid green) to indicate it's complete.
 */
function progressIndicateFinished(text) {
    $('#progress-indicator .progress .progress-bar')
        .removeClass('active')
        .removeClass('progress-bar-striped')
        .addClass('progress-bar-success');
}
