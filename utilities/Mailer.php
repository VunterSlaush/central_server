<?php
require __DIR__.'/PHPMailer/PHPMailerAutoload.php';

class Mailer extends PHPMailer
{
    // Set default variables for all new objects
    public $From     = 'nslourdes@zoho.com';
    public $FromName = 'Club admin';
    public $Host     = 'smtp.zoho.com;stmp.zoho.com';
    public $Mailer   = 'smtp';                         // Alternative to isSMTP()
    public $Port = 587;
    public $SMTPAuth = true;
    public $Username = "nslourdes@zoho.com";
    public $Password = "Jonixxla5";
    public $SMTPDebug = 0;
    public $Debugoutput = 'html';
    public $SMTPSecure = 'tls';
    public $CharSet = 'UTF-8';

    //Extend the send function
    public function send()
    {
        $this->Subject = '[Notificación!] '.$this->Subject;
        return parent::send();
    }

    // Create an additional function
    public function do_something($something)
    {
        // Place your new code here
    }
}
