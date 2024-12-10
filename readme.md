# Cloudflare IP Batch Test Tool
  
As one of the most advanced content delivery network, Cloudflare provides a wide range of Anycast IP for user to resolute. 
This feature is very convenient for developers by using private DNS resolution or CNAME Setup which can avoid changing nameservers.
Although Anycast IP can automatically hit the best node, sometimes it's found that different IPs may have different connection quality.
In order to have a more comprehensive understanding of the access quality in different IP segments, this tool is developed to test a batch of Anycast IP provided by Cloudflare and analyze both respond time and download speed of every IP.  
  
Website: [http://ip.flares.cloud](http://ip.flares.cloud)  
　  

## Function
* HTTP(s) respond time test (when the readyState = 2)
* Average download speed test (with different size of payload)
* Batch test of the two above
* Show the actual loaction of every Anycast IP (according to /cdn-cgi/trace)
* Simple statistical analysis for multiple tests in every IP  
* Adaptation for Mobile devices (only Android tested by now)  
　  
  
## To be ascertained
* The difference between http and https
* The correlation between XMLHttpRequest and ICMP
* The consistency between browser and local software  
　  
  
## May be released in the future
* How to build the backend of this website
* IPv6 Test  

