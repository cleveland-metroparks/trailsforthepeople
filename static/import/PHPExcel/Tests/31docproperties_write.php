<?php
/**
 * PHPExcel
 *
 * Copyright (C) 2006 - 2012 PHPExcel
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * @category   PHPExcel
 * @package    PHPExcel
 * @copyright  Copyright (c) 2006 - 2012 PHPExcel (http://www.codeplex.com/PHPExcel)
 * @license    http://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt	LGPL
 * @version    1.7.7, 2012-05-19
 */

/** Error reporting */
error_reporting(E_ALL);

date_default_timezone_set('Europe/London');

/** Include PHPExcel */
require_once '../Classes/PHPExcel.php';


$inputFileType = 'Excel2007';
$inputFileName = 'templates/31docproperties.xlsx';


echo date('H:i:s') , " Load Tests from $inputFileType file" , PHP_EOL;
$callStartTime = microtime(true);

$objPHPExcelReader = PHPExcel_IOFactory::createReader($inputFileType);
$objPHPExcel = $objPHPExcelReader->load($inputFileName);

$callEndTime = microtime(true);
$callTime = $callEndTime - $callStartTime;
echo 'Call time to read Workbook was ' , sprintf('%.4f',$callTime) , " seconds" , PHP_EOL;
// Echo memory usage
echo date('H:i:s') , ' Current memory usage: ' , (memory_get_usage(true) / 1024 / 1024) , " MB" , PHP_EOL;


echo date('H:i:s') , " Adjust properties" , PHP_EOL;
$objPHPExcel->getProperties()->setTitle("Office 2007 XLSX Test Document")
							 ->setSubject("Office 2007 XLSX Test Document")
							 ->setDescription("Test XLSX document, generated using PHPExcel")
							 ->setKeywords("office 2007 openxml php");


// Save Excel 2007 file
echo date('H:i:s') , " Write to Excel2007 format" , PHP_EOL;
$objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
$objWriter->save(str_replace('.php', '.xlsx', __FILE__));
echo date('H:i:s') , " File written to " , str_replace('.php', '.xlsx', __FILE__) , PHP_EOL;


// Echo memory peak usage
echo date('H:i:s') , " Peak memory usage: " . (memory_get_peak_usage(true) / 1024 / 1024) . " MB" , PHP_EOL;


echo PHP_EOL;
// Reread File
echo date('H:i:s') , " Reread Excel2007 file" , PHP_EOL;
$objPHPExcelRead = PHPExcel_IOFactory::load(str_replace('.php', '.xlsx', __FILE__));

// Set properties
echo date('H:i:s') , " Get properties" , PHP_EOL;

echo 'Core Properties:' , PHP_EOL;
echo '    Created by - ' , $objPHPExcel->getProperties()->getCreator() , PHP_EOL;
echo '    Created on - ' , date('d-M-Y',$objPHPExcel->getProperties()->getCreated()) , ' at ' ,
                       date('H:i:s',$objPHPExcel->getProperties()->getCreated()) , PHP_EOL;
echo '    Last Modified by - ' , $objPHPExcel->getProperties()->getLastModifiedBy() , PHP_EOL;
echo '    Last Modified on - ' , date('d-M-Y',$objPHPExcel->getProperties()->getModified()) , ' at ' ,
                             date('H:i:s',$objPHPExcel->getProperties()->getModified()) , PHP_EOL;
echo '    Title - ' , $objPHPExcel->getProperties()->getTitle() , PHP_EOL;
echo '    Subject - ' , $objPHPExcel->getProperties()->getSubject() , PHP_EOL;
echo '    Description - ' , $objPHPExcel->getProperties()->getDescription() , PHP_EOL;
echo '    Keywords: - ' , $objPHPExcel->getProperties()->getKeywords() , PHP_EOL;


echo 'Extended (Application) Properties:' , PHP_EOL;
echo '    Category - ' , $objPHPExcel->getProperties()->getCategory() , PHP_EOL;
echo '    Company - ' , $objPHPExcel->getProperties()->getCompany() , PHP_EOL;
echo '    Manager - ' , $objPHPExcel->getProperties()->getManager() , PHP_EOL;


echo 'Custom Properties:' , PHP_EOL;
$customProperties = $objPHPExcel->getProperties()->getCustomProperties();
foreach($customProperties as $customProperty) {
	$propertyValue = $objPHPExcel->getProperties()->getCustomPropertyValue($customProperty);
	$propertyType = $objPHPExcel->getProperties()->getCustomPropertyType($customProperty);
	echo '    ' , $customProperty , ' - (' , $propertyType , ') - ';
	if ($propertyType == PHPExcel_DocumentProperties::PROPERTY_TYPE_DATE) {
		echo date('d-M-Y H:i:s',$propertyValue) , PHP_EOL;
	} elseif ($propertyType == PHPExcel_DocumentProperties::PROPERTY_TYPE_BOOLEAN) {
		echo (($propertyValue) ? 'TRUE' : 'FALSE') , PHP_EOL;
	} else {
		echo $propertyValue , PHP_EOL;
	}
}

// Echo memory peak usage
echo date('H:i:s') , " Peak memory usage: " , (memory_get_peak_usage(true) / 1024 / 1024) . " MB" , PHP_EOL;
