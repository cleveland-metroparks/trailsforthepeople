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

    <!-- jQuery -->
    <script type="text/javascript" src="<?= ssl_url('static/common/jquery-1.12.4.min.js'); ?>"></script>

    <!-- jQuery UI -->
    <!-- <script type="text/javascript" src="<?= ssl_url('static/common/jquery-ui-1.8.21.custom.min.js'); ?>"></script> -->
    <script type="text/javascript" src="<?= ssl_url('static/common/jquery-ui-1.11.4/jquery-ui.min.js'); ?>"></script>
    <!-- <link type="text/css" rel="stylesheet" href="<?= ssl_url('static/common/jquery-ui-lightness/jquery-ui-1.8.20.custom.css'); ?>" /> -->
    <link type="text/css" rel="stylesheet" href="<?= ssl_url('static/common/jquery-ui-1.11.4/jquery-ui.min.css'); ?>" />

    <!-- tablesorter -->
    <script type="text/javascript" src="<?= ssl_url('static/common/tablesorter/jquery.tablesorter.js'); ?>"></script>

    <!-- Leaflet map API and Wicket plugin for parsing WKT -->
    <link rel="stylesheet" type="text/css" href="<?= ssl_url('static/common/leaflet-0.7.1/leaflet.css'); ?>" />
    <script type="text/javascript" src="<?= ssl_url('static/common/leaflet-0.7.1/leaflet.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/common/wicket/wicket.js'); ?>"></script>
    <script type="text/javascript" src="<?= ssl_url('static/common/wicket/wicket-leaflet.js'); ?>"></script>

    <!-- TinyMCE, the HTML editor -->
    <script type="text/javascript" src="<?= ssl_url('static/tinymce/jscripts/tiny_mce/jquery.tinymce.js'); ?>"></script>

    <!-- Local back-end CSS -->
    <link href="<?= ssl_url('static/admin/local.css'); ?>" rel="stylesheet">
    <!-- Local common JS -->
    <script type="text/javascript" src="<?= ssl_url('static/common/constants.js'); ?>"></script>
    <!-- Local administration JS -->
    <script type="text/javascript" src="<?= ssl_url('static/admin/admin.js'); ?>"></script>
    <!-- Local contributors JS -->
    <script type="text/javascript" src="<?= ssl_url('static/contributors/contributors.js'); ?>"></script>
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
          <a class="navbar-brand" href="/administration">CM-Trails Admin</a>
        </div>
        <div id="navbar" class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <?= $mainmenu; ?>
          </ul>
        </div><!--/.nav-collapse -->
      </div>
    </nav>

    <div class="container">
      <div class="content">
        <h1><?= $page_title ?></h1>
        <?= $content ?>
      </div><!-- /.content -->
    </div><!-- /.container -->

    <!-- Include all compiled plugins (below), or include individual files as needed -->
    <script src="<?= ssl_url('static/admin/bootstrap/js/bootstrap.min.js'); ?>"></script>
  </body>

</html>
