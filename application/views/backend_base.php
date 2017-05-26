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
    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->

    <!-- JS Libs -->
    <script type="text/javascript" src="<?= ssl_url('static/lib/jquery-1.12.4.min.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/jquery-ui-1.11.4/jquery-ui.min.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/tablesorter/jquery.tablesorter.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/leaflet-1.0.3/leaflet.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/wicket-master/wicket.min.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/wicket-master/wicket-leaflet.min.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/mapbox.js-2.4.0/mapbox.standalone.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/mapbox-gl-js-0.35.1/mapbox-gl.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/mapbox-gl-leaflet/leaflet-mapbox-gl.min.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/lib/tinymce/jscripts/tiny_mce/jquery.tinymce.js'); ?>"></script>

    <!-- CSS -->
    <link type="text/css" rel="stylesheet" href="<?= ssl_url('static/lib/jquery-ui-1.11.4/jquery-ui.min.css'); ?>" />
    <link type="text/css" rel="stylesheet" href="https://trailslocal.clevelandmetroparks.com/static/lib/leaflet-1.0.3/leaflet.css" />
    <link type="text/css" rel="stylesheet" href="https://trailslocal.clevelandmetroparks.com/static/lib/mapbox-gl-js-0.35.1/mapbox-gl.css" />
    <link type="text/css" rel="stylesheet" href="https://trailslocal.clevelandmetroparks.com/static/lib/font-awesome-4.6.3/css/font-awesome.min.css" />
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

    <!-- Include all compiled plugins (below), or include individual files as needed -->
    <script src="<?= ssl_url('static/admin/bootstrap/js/bootstrap.min.js'); ?>"></script>
  </body>

</html>
