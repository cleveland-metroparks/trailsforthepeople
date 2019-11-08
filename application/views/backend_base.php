<?php
  // We're setting $this->page_title in derivative page templates, which means
  // that it's not yet available in MY_Controller::_output(), so we're checking
  // it here for use below.
  $page_title = !empty($this->page_title) ? $this->page_title : 'Administration';
?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title><?= $page_title . ' : ' . htmlspecialchars($this->config->item('title')) ?></title>

    <!-- Bootstrap -->
    <link href="<?= ssl_url('static/admin/bootstrap/css/bootstrap.min.css'); ?>" rel="stylesheet">

    <!-- jQuery -->
    <script type="text/javascript" src="<?= ssl_url('static/lib/jquery-1.12.4.min.js'); ?>"></script>

    <!-- jQuery UI -->
    <!-- <script type="text/javascript" src="<?= ssl_url('static/lib/jquery-ui-1.8.21.custom.min.js'); ?>"></script> -->
    <script type="text/javascript" src="<?= ssl_url('static/lib/jquery-ui-1.11.4/jquery-ui.min.js'); ?>"></script>
    <!-- <link type="text/css" rel="stylesheet" href="<?= ssl_url('static/lib/jquery-ui-lightness/jquery-ui-1.8.20.custom.css'); ?>" /> -->
    <link type="text/css" rel="stylesheet" href="<?= ssl_url('static/lib/jquery-ui-1.11.4/jquery-ui.min.css'); ?>" />
    <link type="text/css" rel="stylesheet" href="<?= site_url('static/lib/mapbox-gl-js-1.5.0/mapbox-gl.css'); ?>" />

    <!-- tablesorter -->
    <script type="text/javascript" src="<?= ssl_url('static/lib/tablesorter/jquery.tablesorter.js'); ?>"></script>

    <!-- Leaflet map API and Wicket plugin for parsing WKT -->
    <link rel="stylesheet" type="text/css" href="<?= ssl_url('static/lib/leaflet-1.5.1/leaflet.css'); ?>" />
    <script type="text/javascript" src="<?= ssl_url('static/lib/leaflet-1.5.1/leaflet.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/wicket-master/wicket.min.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/wicket-master/wicket-leaflet.min.js'); ?>"></script>
    <script type="text/javascript" src="<?= site_url('static/lib/mapbox.js-3.1.1/mapbox.standalone.js'); ?>"></script>
    <script type="text/javascript" src="<?= site_url('static/lib/mapbox-gl-js-1.5.0/mapbox-gl.js'); ?>"></script>
    <script type="text/javascript" src="<?= site_url('static/lib/mapbox-gl-leaflet/leaflet-mapbox-gl.min.js'); ?>"></script>

    <!-- TinyMCE, the HTML editor -->
    <script type="text/javascript" src="<?= ssl_url('static/lib/tinymce/jscripts/tiny_mce/jquery.tinymce.js'); ?>"></script>

    <!-- Local back-end CSS -->
    <link href="<?= ssl_url('static/admin/admin.css'); ?>" rel="stylesheet">

    <!-- Local JS -->
    <?= $js_includes ?>
  </head>

  <body class="<?= $body_classes ?>">
    <nav class="navbar navbar-inverse navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a title="Maps administration home" class="navbar-brand" href="/administration">
            <img height="36" width="36" alt="Cleveland Metroparks logo" src="/static/admin/images/metroparks-logo-only-small-white.png" />
          </a>
        </div>
        <div id="navbar" class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <?= $mainmenu_left; ?>
          </ul>
          <ul class="nav navbar-nav navbar-right">
            <?= $mainmenu_right; ?>
          </ul>
        </div><!--/.nav-collapse -->
      </div>
    </nav>

    <div class="container">
      <div class="content">
        <h1><?= $page_title ?></h1>

        <?php if (!empty($messages)): ?>
        <div class="messages" id="messages">
          <?= $messages ?>
        </div>
        <?php endif; ?>

        <?= $content ?>
      </div><!-- /.content -->
    </div><!-- /.container -->

    <script src="<?= ssl_url('static/admin/bootstrap/js/bootstrap.min.js'); ?>"></script>
  </body>

</html>
