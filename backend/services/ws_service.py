import random
from models import Round
from database import db
from config import SYSTEM_WINRATE

# Generate three dice under a target result ('tai' or 'xiu')
# Tai: sum 11-17, Xiu: sum 4-10

def dice_sum_to_result(total):
    return 'tai' if 11 <= total <= 17 else 'xiu'

def random_three_dice_for(result):
    # enumerate all combos and choose one at random matching result
    combos = []
    for a in range(1,7):
        for b in range(1,7):
            for c in range(1,7):
                s = a+b+c
                if dice_sum_to_result(s) == result:
                    combos.append((a,b,c))
    return random.choice(combos)


def biased_roll():
    # Decide whether house should win according to SYSTEM_WINRATE
    want_house = random.random() < (SYSTEM_WINRATE / 100.0)
    # house wins means result opposite of majority bets; but at WS layer we don't see bets
    # We'll interpret house win as 'x' meaning pick the result the system favors: to ensure house wins often
    # For simplicity: if want_house True pick result that is 'tai' 50% / 'xiu' 50% still biased by want_house
    # Better approach: choose house result random, but weighted to want_house.
    target = random.choice(['tai','xiu'])
    if want_house:
        # choose target that makes house likely to win — this will be used by round logic
        pass
    # return dice and derived result
    dice = random_three_dice_for(target)
    total = sum(dice)
    return dice, dice_sum_to_result(total)
