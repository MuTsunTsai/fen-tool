<!-- Twin move -->
fors 8/3b2p1/1p6/1pb2s2/R2kr3/pP6/Ks5p/6B1
stip h#2
cond CouscousCirce Isardam
twin move g7 g4

<!-- Castling -->
fors r3k3/ppp1p2p/Sb2p3/P1PP2Pp/4S3/7B/3PPRP1/4K2R
stip #3
opti variation

<!-- PG with two solutions -->
fors 2k3sr/ppp2ppp/3qr3/8/8/8/PPPPPPPP/RSBQKBSR
stip dia8.0

<!-- PG with castling -->
fors rsbqkbsr/pppp1p1p/8/4p1p1/1PQP4/8/P1PSPPPP/2KR1BSR
stip dia6.0

<!-- Duplex -->
fors 8/8/2s5/1q6/4R3/kp6/8/K4Q2
stip #2
opti duplex variation
twin stip s#2

<!-- HelpSelfMate -->
fors K7/2P2p2/8/3P4/8/8/k7/8
stip hs#6

<!-- HelpReflexMate -->
fors 8/1P6/2p3R1/K1p5/7k/8/2p5/8
stip hr#2
cond ExclusiveChess

<!-- Tibet -->
rema P1075867
fors 8/2P5/8/6K1/8/8/k3p3/8
stip h=3
cond circe tibet
opti whitetoplay

<!-- Andernach -->
rema P0005385
fors rsbqkbsr/ppp1pppp/8/8/8/8/PPPPPPPP/RSBQKB1R
stip dia3.0
cond Andernach

<!-- AMU -->
rema P1211011
fors 4k3/3p4/8/4P3/8/8/8/8
stip h#4
opti nowk
cond madrasi supercirce amu
